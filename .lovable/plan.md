# Lock the counter at 21

## Why it shows 41
`src/pages/LandingPage.tsx` (lines 305–314) starts at `BASE_COUNT = 21`, then queries the `waitlist` table and does `BASE_COUNT + count`. There are currently **20 real signups** in the waitlist table, so `21 + 20 = 41`. I did not increase the base — the extra 20 come from actual NGO signups accumulated in the database.

## Options — which do you want?

**Option A — Hardcode 21 everywhere (ignore real signups)**
Remove the Supabase query. `waitlistCount` stays at 21 no matter how many people sign up. Number will not move until you manually change the constant.

**Option B — Start from 21 as an offset, keep counting real signups**
Change the formula so 21 is the starting display *today* (treat the current 20 signups as already baked in). New formula: `21 + max(0, count - 20)`. It will show 21 now and only tick up when the 21st real NGO signs up.

**Option C — Just lower BASE_COUNT to 1**
`21 + 20 = 41` becomes `1 + 20 = 21` today, but every new signup still adds 1. Same visual result now as Option B, simpler code, but if signups get deleted the number drops.

My recommendation: **Option B** — it matches what you asked for (“21”) and keeps the counter honest as new NGOs join.

Please pick A, B, or C and I'll apply it.
