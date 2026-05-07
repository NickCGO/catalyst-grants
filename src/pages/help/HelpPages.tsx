import { PageHeader, Steps, Tip, RouteLink } from "./_help-ui";

const pages: Record<string, { title: string; intro: string; steps: string[]; tip?: string; route?: { to: string; label: string } }> = {
  dashboard: {
    title: "Dashboard",
    intro: "Your home base — a snapshot of pipeline value, deadlines, and recent activity.",
    steps: [
      "KPI cards at the top show total pipeline, money won, win rate and active applications.",
      "The Submission Tracker timeline shows what's due in the next 90 days.",
      "Click any card to drill into the full list view.",
    ],
    tip: "Numbers update in real time as you change application statuses.",
    route: { to: "/dashboard", label: "Dashboard" },
  },
  grants: {
    title: "Find Grants",
    intro: "Browse and filter our database of 2,400+ funders. Match scores show how well each fits your profile.",
    steps: [
      "Use the focus area filter to narrow funders by what they care about.",
      "Match score combines focus, geography, timing and method-of-approach signals.",
      "Click a funder card to see full details and start an application.",
    ],
    tip: "If a focus area returns very few funders, try also selecting related areas — many funders use broad descriptions.",
    route: { to: "/grants", label: "Find Grants" },
  },
  applications: {
    title: "Applications",
    intro: "Track every grant you're working on, from drafting through to outcome.",
    steps: [
      "Start an application from a funder card, or click 'New Blank Application' if you don't yet know the funder.",
      "Pick a status: Pending → Submitted → Successful / Unsuccessful.",
      "Use the Kanban view to drag-and-drop between stages, or the list view to bulk edit.",
      "Linked tasks and deadlines are auto-created.",
    ],
    tip: "Blank applications can be linked to a funder later via the 'Attach funder' action.",
    route: { to: "/applications", label: "Applications" },
  },
  proposals: {
    title: "Proposal Writer",
    intro: "AI-assisted proposal drafting that pulls from your organisation profile and the funder's brief.",
    steps: [
      "Click 'New proposal', pick the funder and project.",
      "Generate a section at a time — the AI uses your onboarding data to tailor it.",
      "Edit anything, regenerate any section, and export to .docx when ready.",
    ],
    tip: "Stronger onboarding profile = better drafts. Spend 30 minutes on onboarding once and save days later.",
    route: { to: "/writer", label: "Proposal Writer" },
  },
  tasks: {
    title: "Tasks & Deadlines",
    intro: "Personal & team to-do list, with smart deadline reminders.",
    steps: [
      "Click '+ New task', give it a title and due date.",
      "Set priority — Urgent items show on the dashboard automatically.",
      "Tick off as 'Done' when complete. Overdue items turn red.",
    ],
    tip: "Tasks created automatically from applications mention the funder name in the title.",
    route: { to: "/tasks", label: "Tasks" },
  },
  crm: {
    title: "Funder CRM",
    intro: "Manage your funder relationships like a fundraiser would manage donor relationships.",
    steps: [
      "Each funder you save shows up here with a relationship status.",
      "Log interactions (calls, meetings, emails) on the Activity tab.",
      "Send emails directly from the Communications tab — they auto-update the relationship to 'Contacted'.",
      "Use the Notes tab for private strategic notes (visible only to your team).",
    ],
    tip: "When you send an email from CRM, the funder's reply (if inbound is wired up) lands in your Inbox and links back here automatically.",
    route: { to: "/crm", label: "Funder CRM" },
  },
  inbox: {
    title: "Inbox & Email",
    intro: "Every reply from funders shows up in the in-app inbox so nothing slips through cracks.",
    steps: [
      "Your organisation has a unique inbound address (visible in Settings → Team).",
      "Share that address with funders, or use it as your reply-to.",
      "Replies appear in /inbox and link to the matching funder automatically.",
      "Click 'Reply' to compose from the funder's CRM page so the conversation stays threaded.",
    ],
    tip: "Owners and admins get a notification each time a new email arrives.",
    route: { to: "/inbox", label: "Inbox" },
  },
  reports: {
    title: "Impact Reports",
    intro: "Generate donor-ready reports in minutes using your application & beneficiary data.",
    steps: [
      "Click 'New report' and pick the period you're reporting on.",
      "Choose a format: Narrative, Logframe, or Results Framework.",
      "Add your project updates — the AI weaves it into a polished report.",
      "Export to PDF or .docx and send to your funder.",
    ],
    route: { to: "/reports", label: "Reports" },
  },
  team: {
    title: "Team & Roles",
    intro: "Invite teammates, assign roles, and control who can see and edit what.",
    steps: [
      "Owners and admins can invite via Settings → Team → Invite member.",
      "Assign a role: Owner, Admin, Editor, or Viewer (see permissions matrix on the team page).",
      "Invited users get added once they sign in with the same email address.",
    ],
    tip: "Roles are enforced at the database level — viewers physically can't edit, regardless of which page they're on.",
    route: { to: "/settings/team", label: "Team Settings" },
  },
  settings: {
    title: "Settings",
    intro: "Manage your organisation profile, AI preferences, notifications, modules and team.",
    steps: [
      "Organisation tab: keep your profile up-to-date so matching stays accurate.",
      "AI tab: pick the default tone and length for AI-generated content.",
      "Notifications tab: choose what to be alerted about, and how often.",
      "Team tab: invite members and view your inbound email address.",
    ],
    route: { to: "/settings", label: "Settings" },
  },
  faq: {
    title: "FAQ",
    intro: "Answers to the questions we get most often.",
    steps: [
      "Why are some focus areas returning few funders? Many funders use broad descriptions — try selecting related areas alongside.",
      "How do I delete an application? Open it, then 'Delete' from the actions menu (Editors and above).",
      "Can I export my data? Yes — Settings → Account → Export. We send you a .zip within an hour.",
      "Inbound email isn't arriving — why? The inbox UI is live, but the email-receiving infrastructure needs a provider (Postmark, SendGrid Parse) to be wired by your admin.",
      "How do I cancel my subscription? Settings → Billing → Cancel. Pro-rated refund where applicable.",
    ],
  },
};

export const HelpDashboard = () => Render(pages.dashboard);
export const HelpGrants = () => Render(pages.grants);
export const HelpApplications = () => Render(pages.applications);
export const HelpProposals = () => Render(pages.proposals);
export const HelpTasks = () => Render(pages.tasks);
export const HelpCRM = () => Render(pages.crm);
export const HelpInbox = () => Render(pages.inbox);
export const HelpReports = () => Render(pages.reports);
export const HelpTeam = () => Render(pages.team);
export const HelpSettings = () => Render(pages.settings);
export const HelpFAQ = () => Render(pages.faq);

function Render(p: typeof pages[string]) {
  return (
    <>
      <PageHeader title={p.title} intro={p.intro} />
      <Steps items={p.steps} />
      {p.tip && <Tip>{p.tip}</Tip>}
      {p.route && (
        <div className="mt-4">
          <RouteLink to={p.route.to} label={p.route.label} />
        </div>
      )}
    </>
  );
}
