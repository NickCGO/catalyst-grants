# Bump the Charter spots base count

Change `BASE_COUNT` in `src/pages/LandingPage.tsx` (line 305) from `17` to `21`.

That single constant feeds all three "X of 50 Charter spots taken" displays (nav, hero, pricing), so the number updates everywhere at once. The real Supabase signup count is still added on top, so if any new NGOs have signed up the displayed number will be `21 + <db count>`.

## Technical notes

- File: `src/pages/LandingPage.tsx`
- One-line change: `const BASE_COUNT = 17;` → `const BASE_COUNT = 21;`
