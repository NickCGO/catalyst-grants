# Cherry-pick CRM additions (adapted to existing schema)

Drop everything in the pasted script that already exists or conflicts. Keep only the genuinely new pieces, rewritten to match the project's conventions: `org_id` references `organisations.id` (not `auth.users`), RLS uses `is_org_member()` / `has_org_role()`, and no FKs to `auth.users`.

## What gets created

### 1. `email_threads` — inbox sync (Gmail/Outlook)
Stores synced email conversations linked to a funder relationship or application. Complements existing `inbound_emails` (which is webhook-based) and `crm_emails` (outbound drafts).

Columns: `org_id`, `funder_id` (nullable), `application_id` (nullable), `relationship_id` (nullable), `provider_thread_id`, `provider_message_id`, `direction` ('inbound'|'outbound'), `from_address`, `to_addresses[]`, `subject`, `snippet`, `body_html`, `sent_at`, `synced_at`.
Unique `(org_id, provider_message_id)`.

### 2. `automation_rules` — trigger/action rules per org
Columns: `org_id`, `name`, `trigger_event` (enum), `action_type` (enum), `action_payload` (jsonb), `is_active`.

Trigger events: `application_submitted`, `application_won`, `application_lost`, `deadline_approaching_7d`, `deadline_approaching_1d`, `no_reply_after_14d`, `no_activity_after_30d`.
Action types: `create_task`, `send_notification`, `send_email_draft`, `move_kanban_column`.

### 3. `email_credentials` — OAuth tokens for inbox connection
One row per org. Stores Vault secret IDs only, not raw tokens.
Columns: `org_id` (unique), `provider` ('gmail'|'outlook'|'smtp'), `email_address`, `access_token_secret_id`, `refresh_token_secret_id`, `token_expires_at`, `last_synced_at`.

### 4. Reporting views
- `pipeline_summary` — counts/value/avg-deadline grouped by `org_id` + `applications.kanban_column` (uses existing `applications` table, not a new `opportunities` one).
- `stage_velocity` — average days between `created_at` and last update per kanban column.

Views are `security_invoker` so existing RLS on `applications` applies automatically.

## What gets dropped from your script

| Dropped | Reason |
|---|---|
| `funders` | Already exists as public 2,416-row reference DB |
| `contacts` | Use `funders.contact_person`/`email` + future extension |
| `opportunities` | Covered by `applications` |
| `proposals` | Already exists |
| `activities` | Covered by `funder_interactions` + `crm_activity_notes` |
| `tasks` | Already exists |
| All `opportunity_stage`, `proposal_status`, `activity_type` enums | Conflict / unused |
| `auth.users` FKs | Forbidden by project rules |
| `org_id = auth.uid()` RLS | Wrong — org_id is the organisation UUID |

## RLS pattern (applied to all 3 new tables)

```sql
-- View: any active team member
USING (is_org_member(org_id, auth.uid()))
-- Mutate: editor+ role
WITH CHECK (has_org_role(org_id, auth.uid(), 'editor'))
```

`email_credentials` gets stricter rules: only `admin`+ can read/write (tokens are sensitive).

## Indexes
- `email_threads (org_id)`, `(funder_id)`, `(application_id)`, `(provider_thread_id)`
- `automation_rules (org_id, is_active)`
- `email_credentials (org_id)` (already unique)

## Triggers
- Reuse existing `update_updated_at_column()` for `updated_at` on all 3 tables.

## Out of scope (ask separately if needed)
- Actual OAuth flow / edge functions for Gmail/Outlook sync
- Automation execution engine (cron job that evaluates triggers)
- UI for managing rules or connected inboxes

These are bigger features — the schema above just lays the foundation.

## After approval
I'll run one migration with all of the above, then we can decide whether to wire up the OAuth + sync edge functions next.
