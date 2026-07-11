# Why the numbers disagree

All three "X of 50 Charter spots taken" instances on the landing page read from the **same** `waitlistCount` state in `src/pages/LandingPage.tsx`. There is only one source of truth, so the fix is not "change 17 to 37 in some file" — the bug is in how the animated counter displays that state.

What actually happens:

1. On page load, `waitlistCount` starts at `BASE_COUNT = 17` (line 305).
2. A moment later, the Supabase query returns the real signup count and updates the state to `17 + <db count>` (e.g. `37`).
3. The nav counter (top of page) is on-screen immediately, so `AnimatedCounter` animates to `17` and then locks itself with an internal `started.current = true` flag. When `end` later changes to `37`, the effect re-runs but the guard blocks any further animation — the nav is stuck at **17**.
4. The pricing-section counter is far down the page. By the time you scroll to it, `end` is already `37`, so it animates straight to **37**.

Result: nav shows 17, pricing shows 37, even though the state is identical.

# The fix

One small change in `src/components/AnimatedCounter.tsx`: let the counter re-animate (or at least jump) when the `end` prop changes after the first run, instead of latching forever on the first value it saw.

Concretely, in the `useEffect`, when `end` changes and the counter has already started, reset the animation to the new target (either by clearing `started.current` so the IntersectionObserver-triggered animation runs again on the next intersection, or by animating from the current displayed value to the new `end` immediately).

## Technical notes

- File to change: `src/components/AnimatedCounter.tsx` only.
- No changes to `LandingPage.tsx`, no change to `BASE_COUNT`, no change to the Supabase query.
- The three call sites (nav line 56, hero line 394, pricing line 640) all keep reading the same shared state and will render the same number after the fix.
- Side benefit: any other place using `AnimatedCounter` with a value that arrives asynchronously (e.g. fetched stats) will also start displaying correctly.
