import LegalPageLayout from "@/components/LegalPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="16 June 2026">
      <p>
        Find The Grant ("we", "us", "our") provides a grant discovery and proposal-writing platform for
        non-governmental organisations ("NGOs"). This Privacy Policy explains what personal information we
        collect, why we collect it, and how it is used, stored, and protected.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account information:</strong> name, email address, password (stored as a salted hash), organisation name, and country.</li>
        <li><strong>Organisation profile:</strong> mission, programme areas, budget, and other details you provide to power funder matching and proposal generation.</li>
        <li><strong>Billing information:</strong> handled directly by our payment processor, Stripe. We do not store your card number.</li>
        <li><strong>Email integration data:</strong> if you choose to connect Gmail or Outlook, we request only the minimum scopes required to send mail on your behalf and read messages relevant to funder communication. You can disconnect this at any time from Settings.</li>
        <li><strong>Usage data:</strong> pages visited, features used, and basic device/browser information, used to improve the product.</li>
        <li><strong>Content you create:</strong> proposals, CRM notes, tasks, and uploaded documents.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide and operate the matching engine, proposal writer, CRM, and reporting features.</li>
        <li>To process subscription payments and send billing-related communication.</li>
        <li>To send transactional emails (e.g. password resets, team invitations, support replies).</li>
        <li>To respond to support requests submitted via the in-app chat or escalation form.</li>
        <li>To improve the platform through aggregated, de-identified usage analysis.</li>
      </ul>
      <p>We do not sell your personal information, and we do not share your organisation's data with funders or other users without your explicit action (for example, submitting an application).</p>

      <h2>3. Third-party processors</h2>
      <p>We rely on the following processors to operate the service. Each processes data under its own privacy and security terms:</p>
      <ul>
        <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
        <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
        <li><strong>Google / Microsoft</strong> — optional email sending and inbox access, only if you connect an inbox.</li>
        <li>AI providers used to power proposal drafting and the support assistant, which process the text you submit to generate responses.</li>
      </ul>

      <h2>4. Data retention</h2>
      <p>We retain your account and organisation data for as long as your account is active. If you close your account, we will delete or anonymise your personal data within a reasonable period, except where we are required to retain records (e.g. billing history) for legal or accounting purposes.</p>

      <h2>5. Your rights</h2>
      <p>Depending on your location, you may have the right to access, correct, export, or delete your personal information. To exercise any of these rights, contact us at <a href="mailto:info@findthegrant.com">info@findthegrant.com</a> and we will respond within a reasonable timeframe.</p>

      <h2>6. Security</h2>
      <p>We use industry-standard safeguards, including encryption in transit, row-level access controls on our database, and restricted access to production systems. No system is perfectly secure, and we encourage you to use a strong, unique password.</p>

      <h2>7. Cookies</h2>
      <p>We use essential cookies/local storage required for authentication and basic analytics to understand how the product is used. We do not use third-party advertising trackers.</p>

      <h2>8. Children's privacy</h2>
      <p>Find The Grant is intended for organisational use by adults working at or with NGOs. We do not knowingly collect data from children.</p>

      <h2>9. Changes to this policy</h2>
      <p>We may update this policy from time to time. Material changes will be communicated by email or via an in-app notice before they take effect.</p>

      <h2>10. Contact us</h2>
      <p>Questions about this policy or your data can be sent to <a href="mailto:info@findthegrant.com">info@findthegrant.com</a>.</p>
    </LegalPageLayout>
  );
}
