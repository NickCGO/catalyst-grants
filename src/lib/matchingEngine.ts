import { supabase } from "@/integrations/supabase/client";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

const PAGE_SIZE = 1000;

/**
 * Supabase's REST API caps unbounded `select()` calls at a default row limit (1000).
 * Page through with `.range()` until a page comes back short, to fetch the full table.
 */
async function fetchAllRows<T = any>(table: string, select: string): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table as any).select(select).range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const batch = (data || []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

interface OrgProfile {
  id: string;
  focus_areas: string[] | null;
  country: string | null;
  region: string | null;
  regions_of_operation: string[] | null;
  works_rural: boolean | null;
  works_urban: boolean | null;
  works_internationally: boolean | null;
  works_other_african: boolean | null;
}

/**
 * Compute match scores for an organisation against all funders.
 * Scores are based on:
 *   - Focus area overlap (40%)
 *   - Geographic alignment (25%)
 *   - Timing — is funder open this month? (20%)
 *   - Method compatibility (15%)
 */
export async function computeMatchScores(org: OrgProfile): Promise<number> {
  const orgFocus = new Set(org.focus_areas || []);
  if (orgFocus.size === 0) return 0;

  // Fetch all funder focus areas, windows, and funders in parallel (paginated — these
  // tables can exceed the API's default 1000-row cap on a single select).
  const [focusRows, windowRows, funderRows] = await Promise.all([
    fetchAllRows<any>("funder_focus_areas", "*"),
    fetchAllRows<any>("funder_windows", "*"),
    fetchAllRows<any>("funders", "id, geographical_area, method_of_approach, category"),
  ]);

  // Index windows and funders by id
  const windowMap: Record<string, any> = {};
  windowRows.forEach(w => { if (w.funder_id) windowMap[w.funder_id] = w; });
  const funderMap: Record<string, any> = {};
  funderRows.forEach(f => { funderMap[f.id] = f; });

  const currentMonth = MONTH_KEYS[new Date().getMonth()];
  const orgGeo = `${org.country || ""} ${org.region || ""} ${(org.regions_of_operation || []).join(" ")}`.toLowerCase();

  const matches: Array<{
    funder_id: string; match_score: number | null;
    focus_score: number | null; geo_score: number | null; timing_score: number | null; method_score: number | null;
  }> = [];

  for (const row of focusRows) {
    if (!row.funder_id) continue;
    const funder = funderMap[row.funder_id];
    if (!funder) continue;

    // 1. Focus score (40%) — funders with no focus-area tags at all are flagged as
    // "general" (null score) rather than scored, since there's nothing to match against.
    const funderAreas = focusColumns.filter(col => (row as any)[col] === true);
    if (funderAreas.length === 0) {
      matches.push({
        funder_id: row.funder_id,
        match_score: null,
        focus_score: null,
        geo_score: null,
        timing_score: null,
        method_score: null,
      });
      continue;
    }
    const overlap = funderAreas.filter(a => orgFocus.has(a)).length;
    const focusScore = Math.round((overlap / Math.max(orgFocus.size, 1)) * 100);

    // 2. Geo score (25%)
    let geoScore = 50; // default mid-range
    const fGeo = (funder.geographical_area || "").toLowerCase();
    if (fGeo) {
      if (fGeo.includes("national") || fGeo.includes("all") || fGeo.includes("worldwide") || fGeo.includes("international")) {
        geoScore = 80;
      }
      if (orgGeo && (fGeo.includes((org.country || "").toLowerCase()) || fGeo.includes((org.region || "").toLowerCase()))) {
        geoScore = 100;
      }
      if (fGeo.includes("africa") && (org.works_other_african || org.works_internationally)) {
        geoScore = Math.max(geoScore, 75);
      }
    }

    // 3. Timing score (20%)
    const windowRow = windowMap[row.funder_id];
    let timingScore = 40; // default if no window data
    if (windowRow) {
      if (windowRow[currentMonth] === true) {
        timingScore = 100;
      } else {
        // Check next 2 months
        const monthIdx = new Date().getMonth();
        const next1 = MONTH_KEYS[(monthIdx + 1) % 12];
        const next2 = MONTH_KEYS[(monthIdx + 2) % 12];
        if (windowRow[next1] === true || windowRow[next2] === true) {
          timingScore = 70;
        } else {
          timingScore = 20;
        }
      }
    }

    // 4. Method score (15%)
    let methodScore = 50;
    const method = (funder.method_of_approach || "").toLowerCase();
    if (method.includes("proposal") || method.includes("loe") || method.includes("letter")) {
      methodScore = 80;
    }
    if (method.includes("application form") || method.includes("online")) {
      methodScore = 90;
    }

    const totalScore = Math.round(
      focusScore * 0.4 + geoScore * 0.25 + timingScore * 0.2 + methodScore * 0.15
    );

    if (totalScore >= 20) {
      matches.push({
        funder_id: row.funder_id,
        match_score: Math.min(100, totalScore),
        focus_score: focusScore,
        geo_score: geoScore,
        timing_score: timingScore,
        method_score: methodScore,
      });
    }
  }

  // Batch upsert in chunks of 500
  const CHUNK = 500;
  for (let i = 0; i < matches.length; i += CHUNK) {
    const chunk = matches.slice(i, i + CHUNK).map(m => ({
      org_id: org.id,
      funder_id: m.funder_id,
      match_score: m.match_score,
      focus_score: m.focus_score,
      geo_score: m.geo_score,
      timing_score: m.timing_score,
      method_score: m.method_score,
      calculated_at: new Date().toISOString(),
    }));

    await supabase
      .from("grant_matches")
      .upsert(chunk, { onConflict: "org_id,funder_id" });
  }

  return matches.length;
}

// All focus area column names from funder_focus_areas table
const focusColumns = [
  "aged_elderly", "agriculture_land", "animals", "arts_culture",
  "capacity_building_governance", "children", "community_development",
  "disability", "displaced_refugees", "education_ecd",
  "entrepreneur_skills_vocational", "environment_conservation",
  "families_parents", "health_aids_sexual_reproductive",
  "housing_homeless", "human_rights_advocacy", "lgbtqi_gender_equality",
  "peace_conflict_resolution", "poverty_livelihood", "religion",
  "science_research", "sports", "welfare",
  "women_gender_dv_girls", "youth",
];
