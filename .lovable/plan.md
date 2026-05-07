## Scope

Wrap up the final 4 items from the bug list:

1. Per-org inbound email — finish app-side (skip provider DNS for now)
2. Team management — surface in Settings + invite-acceptance flow
3. Navigation guide — full Help docs hub + product tour with persistent help button
4. Helper-text pass across all user-facing forms

---

## 1. Per-org inbound email (app-side only)

Backend (`inbound-email` function) and `inbound_emails` table already exist. Remaining work:

- **Inbox UI**: new `/inbox` route + sidebar entry showing received messages grouped by funder, with read/unread state, reply button (opens existing `CRMEmailComposer` pre-filled), and link to the funder's CRM detail page.
- **CRM detail page**: add an "Inbox" tab on `CRMDetailPage.tsx` that lists `inbound_emails` for that funder alongside the existing sent emails — gives a true threaded view.
- **Notifications**: when `inbound_emails` row is inserted, create a `notifications` row for org owner + admins (DB trigger).
- **Settings → Email tab**: show the org's unique inbound address (`{token}@inbox.grant-match.app`) with copy button and a "Not yet active — provider setup pending" badge so users know it's reserved but inactive.

No DNS / provider work is done now; the webhook stays ready for when Postmark/SendGrid is wired.

---

## 2. Team management in Settings + invite acceptance

- **Settings page**: add a "Team" tab that embeds the existing `TeamManagementPage` content (extract into `TeamManagementSection` component so it works both standalone and inside Settings).
- **Invite acceptance flow**:
  - New `/accept-invite?token=...` route.
  - On signup or login with a matching invite email, auto-convert `team_invites` → `team_members` (active) and redirect to that org's dashboard.
  - Edge function `accept-team-invite` handles token validation + insert.
- **Org switcher** (lightweight): if a user belongs to multiple orgs via `team_members`, add a small org selector in the top header so they can switch context.

---

## 3. Navigation guide — Help hub + product tour

**Help docs hub** (`/help`) — full sidebar layout with sub-routes:

```
/help                    Overview / getting started
/help/dashboard          Reading the dashboard
/help/grants             Finding & filtering grants
/help/applications       Tracking applications
/help/proposals          Writing proposals with AI
/help/crm                Funder CRM & email hub
/help/tasks              Tasks & deadlines
/help/reports            Impact reports
/help/team               Inviting teammates & roles
/help/settings           Account, billing, inbound email
/help/faq                FAQ & troubleshooting
```

Each sub-page: short intro + step-by-step + screenshot placeholder slots + "Start tour for this feature" button.

**Product tour** (using `react-joyride` or a small custom popover walker):
- Auto-starts once after onboarding completes (flag stored in `org_settings.tour_completed`).
- 8–10 steps covering sidebar nav, dashboard KPIs, Grants, Applications, CRM, Tasks, Help button.
- **Persistent floating Help button** (bottom-right, on every authenticated page) with menu: "Replay tour", "Open Help center", "Contact support".

---

## 4. Helper-text pass across all forms

Add concise helper text (1 line under each label) and tooltips (`?` icon) on every user-facing form:

- **Onboarding** (9 steps) — micro-explanations per field already partial, fill remaining gaps
- **Tasks** — title, due date, related grant, priority
- **Applications** — project name, amount, deadline, status, route, notes
- **Proposals editor** — section purpose hints
- **CRM** — funder fields, email composer (subject, body), activity note types
- **Reports** — period, format, project updates
- **Settings** — profile, notifications, email, team, billing
- **Funder edit modal** — every field

Pattern: `<Label>Field <Tooltip>?</Tooltip></Label><p class="text-xs text-muted-foreground">Short hint.</p><Input ... />`

Centralize copy in `src/lib/formHints.ts` so it's consistent and easy to edit.

---

## Technical details

- **New files**: `src/pages/InboxPage.tsx`, `src/pages/HelpLayout.tsx` + 11 sub-pages, `src/pages/AcceptInvitePage.tsx`, `src/components/ProductTour.tsx`, `src/components/HelpFloatingButton.tsx`, `src/components/TeamManagementSection.tsx`, `src/lib/formHints.ts`, edge function `accept-team-invite`.
- **DB**: trigger on `inbound_emails` insert → `notifications`; no schema changes for the rest.
- **Deps**: `react-joyride` for the tour.
- **Routing**: add to `src/App.tsx`.
- **Sidebar**: add Inbox + Help entries.

---

## Out of scope

- Postmark/SendGrid DNS setup (deferred per your choice).
- Tour analytics tracking.
- Multi-language help content (English only).
