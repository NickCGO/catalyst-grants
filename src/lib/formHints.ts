// Centralized helper-text copy used across all user-facing forms.
// Keep each hint to ONE clear sentence aimed at non-technical users.

export const hints = {
  // ---------- Tasks ----------
  task: {
    title: "What needs to happen, in a few words. e.g. 'Draft Mott Foundation cover letter'.",
    description: "Optional notes — context, links, who to contact, definition of done.",
    priority: "Urgent = blocks a deadline. High = this week. Medium = this month. Low = whenever.",
    dueDate: "When this should be finished. We'll send a reminder a few days before.",
  },

  // ---------- Applications ----------
  application: {
    projectName: "The name of the project you're funding with this grant. Visible to your team only.",
    funder: "Pick the funder you're applying to. You can also start blank and link a funder later.",
    amountRequested: "How much you plan to ask for, in USD.",
    amountAwarded: "Fill in once you know the result. Leave blank if pending.",
    deadline: "Submission deadline. We auto-suggest one based on the funder's window where possible.",
    status: "Pending = drafting / preparing. Submitted = sent to funder. Successful / unsuccessful once you know.",
    notes: "Free-form notes — questions to clarify, requirements, attachments needed.",
    activityCategory: "Which programme this falls under (e.g. Education, Health). Helps with reporting.",
    applicationRoute: "How you'll submit (online portal, email, postal). Useful for the team.",
  },

  // ---------- CRM / Funder ----------
  crm: {
    relationshipStatus: "Where you are in the conversation: prospect → contacted → engaged → applied → funded.",
    nextActionDate: "When you next plan to do something with this funder. Drives your follow-up reminders.",
    nextActionType: "What you'll do next, e.g. 'Send intro email', 'Call programme officer'.",
    nextActionNote: "Extra context for the action so anyone on your team can pick it up.",
    notes: "Strategic notes about this relationship — internal use only.",
    emailSubject: "Keep it short and specific. The funder sees this first.",
    emailBody: "Your message. Be specific about why you're a fit and what you're asking for.",
    interactionType: "What kind of touch this was — meeting, call, email, event, etc.",
    interactionSummary: "One or two lines about what was discussed and what's next.",
  },

  // ---------- Proposals ----------
  proposal: {
    title: "Internal name so you can find this proposal again. Often the project + funder.",
    funder: "Which funder this proposal is for. Determines tone and any required sections.",
    section: "AI uses your org profile to draft this section. You can edit anything it produces.",
  },

  // ---------- Reports ----------
  report: {
    period: "The reporting period this covers — usually quarterly, biannual or annual.",
    format: "Narrative for storytelling, Logframe for indicators, Results Framework for outcomes.",
    projectUpdates: "What happened this period — activities, beneficiaries reached, milestones, challenges.",
    funder: "If this report is going to a specific funder, pick them so we tailor the tone.",
  },

  // ---------- Settings — Profile ----------
  profile: {
    orgName: "Your registered organisation name. Funders see this on outgoing emails.",
    country: "Where your organisation is registered.",
    region: "Province or state.",
    orgSize: "Approximate full-time-equivalent staff count.",
    website: "Your public website. Used by funders to verify legitimacy.",
    mission: "One paragraph: what you do, who you serve, why you exist.",
    annualIncome: "Last full financial year. Used to match funders that fund organisations of your size.",
    incomeSources: "Roughly where your money comes from. Should add up to 100%.",
    focusAreas: "Pick all that apply — drives which funders match you.",
    registrationNumber: "NPO / NGO / charity registration number, if you have one.",
    ceoName: "Person funders should address correspondence to.",
  },

  // ---------- Settings — AI ----------
  ai: {
    tone: "Default tone for AI-generated proposals and emails. You can override per document.",
    reportFormat: "Your preferred report structure when generating new reports.",
    writingLength: "Concise = short. Standard = balanced. Detailed = long-form for complex grants.",
  },

  // ---------- Settings — Notifications ----------
  notifications: {
    digest: "How often to receive email summaries. Off = in-app only.",
  },

  // ---------- Team ----------
  team: {
    inviteEmail: "The exact email address they'll sign in with. Case doesn't matter.",
    role: "Owner = full control. Admin = manage team & data. Editor = create/edit. Viewer = read-only.",
    inboundAddress: "Share this with funders so their replies land in your in-platform inbox.",
  },

  // ---------- Onboarding ----------
  onboarding: {
    foundedYear: "The year your organisation was legally founded.",
    missionStatement: "One paragraph that summarises what you do and who you serve.",
    visionStatement: "Your long-term aspiration — the change you want to see in the world.",
    coreValues: "3–5 values that guide how your team works.",
    theoryOfChange: "If we do X, then Y will happen, leading to Z impact.",
    problemStatement: "What problem are you solving? Use evidence and numbers if you can.",
    interventionApproach: "How you tackle the problem — your method or model.",
    primaryTargetGroup: "Who your work directly benefits.",
    annualBudget: "Your total annual operating budget in USD.",
    fundingGap: "How much more funding you need this year to fully deliver your plan.",
  },
};

export type HintGroup = keyof typeof hints;
