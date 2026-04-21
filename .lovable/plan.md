

## Add Avg Engagement Duration & Activity Heatmap to Admin Analytics

Extend the **Admin → Website Analytics** tab with two new visualizations: average engagement time per visitor, and an hour-of-day × day-of-week activity heatmap.

### What you'll see

1. **New KPI card: "Avg Engagement / Visitor"**
   - Added to the existing summary row alongside Unique Visitors, Sessions, Page Views, Avg Duration, Bounce Rate.
   - Calculated as: total session duration ÷ unique visitors (formatted as `m:ss`).
   - Differs from "Avg Duration" (per-session) by aggregating multiple sessions per returning visitor.

2. **New chart: "Activity Heatmap"**
   - 7-row × 24-column grid (Mon–Sun × 00:00–23:00).
   - Each cell shaded by page-view count for that hour/day bucket; darker = busier.
   - Hover tooltip shows exact count and time bucket.
   - Helps spot peak traffic windows (e.g. weekday evenings).
   - Uses the existing accent color (#0EA5E9) with opacity scaling for intensity.

### Technical changes

**`supabase/functions/admin-analytics/index.ts`**
- Compute `avgEngagementPerVisitor`: sum `duration_seconds` across sessions, divide by unique visitor count.
- Compute `heatmap`: aggregate `analytics_page_views` into a `{ day: 0–6, hour: 0–23, count: number }[]` array (168 buckets).
- Add both to the JSON response payload.

**`src/pages/AdminPage.tsx`**
- Add new KPI card in the summary grid (adjust grid to 6 columns on lg).
- Add new "Activity Heatmap" card below the daily traffic chart.
- Build heatmap as a CSS-grid of div cells (no new dependency); compute max count to scale opacity per cell.
- Realtime subscription already in place — heatmap and new KPI will refresh automatically with the existing debounced reload.

### Notes

- No schema changes; both metrics derive from existing `analytics_sessions` / `analytics_page_views` data.
- Heatmap uses local browser timezone interpretation of `created_at` for bucketing (computed server-side in UTC for consistency across admins).
- Empty cells render as faint outlined squares so the grid stays legible when traffic is sparse.

