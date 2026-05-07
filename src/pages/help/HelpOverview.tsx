import { PageHeader, Steps, Tip, StartTourButton, RouteLink } from "./_help-ui";

export default function HelpOverview() {
  return (
    <>
      <PageHeader
        title="Welcome to GrantMatch"
        intro="Everything you need to find funding, manage applications and grow funder relationships — in one place."
      />

      <h3 className="text-base font-semibold text-foreground mt-6">The 5-minute orientation</h3>
      <Steps items={[
        "Complete your organisation profile (Onboarding) — this powers every recommendation.",
        "Browse Find Grants and save the funders that look like a fit.",
        "Move strong matches into Applications and start tracking your work.",
        "Use the Funder CRM to log conversations, send emails, and plan follow-ups.",
        "Keep an eye on your Tasks & Deadlines to never miss a submission window.",
      ]} />

      <Tip>You can replay this orientation any time by clicking the floating <strong>Help</strong> button at the bottom-right.</Tip>

      <StartTourButton />

      <h3 className="text-base font-semibold text-foreground mt-8">Quick jumps</h3>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <RouteLink to="/dashboard" label="Dashboard" />
        <RouteLink to="/grants" label="Find Grants" />
        <RouteLink to="/applications" label="Applications" />
        <RouteLink to="/crm" label="Funder CRM" />
      </div>
    </>
  );
}
