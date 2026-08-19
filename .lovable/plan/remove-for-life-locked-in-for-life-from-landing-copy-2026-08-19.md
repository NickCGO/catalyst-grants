# Remove "for life" / "locked in for life" from landing copy

Scope: Replace the phrase in the hero button and every other instance of "for life" / "locked in for life" across the landing page and related pricing copy. Keep the $47/month price and the "first 50" scarcity framing intact.

I will make each edit as a separate step so you can approve/reject them individually. If a step is not approved, I will skip only that step.

## Step 1 — Hero button (line 399)
Current: `Claim your spot: $47/month for life`
Proposed: `Claim your spot: $47/month`
File: `src/pages/LandingPage.tsx`

## Step 2 — Hero supporting text (line 414)
Current: `Only 50 Charter spots at $47/month for life. Cancel any time.`
Proposed: `Only 50 Charter spots at $47/month. Cancel any time.`
File: `src/pages/LandingPage.tsx`

## Step 3 — Pricing section headline (line 604)
Current: `Charter pricing is $47/month, locked in for life — but only the first 50 NGOs get it.`
Proposed: `Charter pricing is $47/month — but only the first 50 NGOs get it.`
File: `src/pages/LandingPage.tsx`

## Step 4 — Pricing plan card subtext (line 621)
Current: `(Locked in for life · only the first 50 NGOs)`
Proposed: `($47/month · only the first 50 NGOs)`
File: `src/pages/LandingPage.tsx`

## Step 5 — Pricing urgency line (line 654)
Current: `⚡ Only 50 Charter spots at $47/month for life. Then pricing rises to $99/month.`
Proposed: `⚡ Only 50 Charter spots at $47/month. Then pricing rises to $99/month.`
File: `src/pages/LandingPage.tsx`

## Step 6 — Final CTA footer line (line 677)
Current: `Only 50 Charter spots. Cancel any time. $47/month for life if you join now.`
Proposed: `Only 50 Charter spots. Cancel any time. $47/month if you join now.`
File: `src/pages/LandingPage.tsx`

## Step 7 — Signup form checkbox (line 306)
Current: `I commit to paying $47/month for life as one of the first 50 Charter Members.`
Proposed: `I commit to paying $47/month as one of the first 50 Charter Members.`
File: `src/pages/LandingPage.tsx`

## Step 8 — FAQ cancellation answer (line 371)
Current: `Yes. Cancel any time, no questions asked. Charter Members keep the $47/month rate for life as long as they remain subscribed.`
Proposed: `Yes. Cancel any time, no questions asked. Charter Members keep the $47/month rate as long as they remain subscribed.`
File: `src/pages/LandingPage.tsx`

## Step 9 — Pricing page founders tier highlight
Current: `Locked-in founding-member price for life`
Proposed: `Charter Member price — limited to the first 50 NGOs`
File: `src/lib/tierLimits.ts` (used by `src/pages/PricingPage.tsx`)

## Step 10 — Terms page legal copy
Current: `Founding-member pricing ($47/month) is locked in for as long as the subscription remains active...`
Note: This is legal/TOS language, not marketing copy. It does not contain the exact phrase "for life" or "locked in for life", but it is the related concept. If you want this updated too, I will change it to remove the "locked in" framing. Default action: leave this step pending unless you approve it.
File: `src/pages/TermsPage.tsx`

After you approve the steps, I will apply them and verify the text on the live preview.