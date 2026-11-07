# Architecture rules
- Store voluntary profile deferral in organisations.org_settings.quick_start, separate from onboarding_complete, so browsing never misrepresents application readiness.
- Gate application creation in shared entry controls and drafting routes; carry a validated same-app return destination through profile completion so the selected grant is retained.
- Authorize privileged functions through shared server-side identity, protected platform roles, organisation access, and atomic AI allowances; client navigation is never an authorization boundary.
- Bind email OAuth callbacks to signed, expiring, single-use server state and recheck workspace ownership before exchanging credentials.
- Sanitize generated document HTML at rendering and export boundaries, including previously stored documents, to prevent script execution.