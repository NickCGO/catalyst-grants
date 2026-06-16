import LegalPageLayout from "@/components/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="16 June 2026">
      <p>
        These Terms of Service ("Terms") govern your use of Find The Grant (the "Service"), operated by Find The
        Grant ("we", "us", "our"). By creating an account or using the Service, you agree to these Terms.
      </p>

      <h2>1. The service</h2>
      <p>Find The Grant helps NGOs discover funders, track applications, draft proposals with AI assistance, manage funder relationships, and generate impact reports. Features and pricing may evolve as the product develops.</p>

      <h2>2. Accounts</h2>
      <p>You must provide accurate information when creating an account and are responsible for keeping your login credentials secure. You are responsible for activity that occurs under your organisation's account, including actions taken by team members you invite.</p>

      <h2>3. Subscriptions and billing</h2>
      <ul>
        <li>Paid plans are billed monthly in advance via Stripe, in USD, unless otherwise stated.</li>
        <li>Founding-member pricing ($47/month) is locked in for as long as the subscription remains active and is not retroactively available to members who cancel and later resubscribe.</li>
        <li>You can cancel at any time from Settings; cancellation takes effect at the end of the current billing period, and you will not be charged again.</li>
        <li>Fees are non-refundable except where required by law, or at our discretion.</li>
        <li>We may change pricing for new subscribers at any time; existing subscribers will be notified before any price change affecting them.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose, including misrepresenting your organisation to funders.</li>
        <li>Attempt to access another organisation's data, reverse-engineer the platform, or interfere with its operation.</li>
        <li>Use the connected-email feature to send unsolicited bulk email (spam).</li>
        <li>Resell or sublicense access to the Service without our written consent.</li>
      </ul>

      <h2>5. AI-generated content</h2>
      <p>Proposal drafts, scoring, and other AI-assisted output are provided to support — not replace — your own judgement. We do not guarantee that AI-generated content is accurate, complete, or will result in funding, and you are responsible for reviewing and approving anything submitted to a funder.</p>

      <h2>6. Your content</h2>
      <p>You retain ownership of the organisation data, proposals, and other content you create. By using the Service you grant us a limited licence to host, process, and display that content as needed to operate the platform.</p>

      <h2>7. Email integration</h2>
      <p>If you connect a Gmail or Outlook account, you authorise us to send and read email on your behalf strictly for the purpose of the Email Hub and Funder CRM features. You can disconnect this access at any time from Settings.</p>

      <h2>8. Termination</h2>
      <p>We may suspend or terminate accounts that violate these Terms or applicable law. You may close your account at any time; see our Privacy Policy for what happens to your data after closure.</p>

      <h2>9. Disclaimers and limitation of liability</h2>
      <p>The Service is provided "as is" without warranties of any kind. We do not guarantee funding outcomes, uninterrupted availability, or that the funder database is exhaustive or error-free. To the maximum extent permitted by law, our liability for any claim relating to the Service is limited to the amount you paid us in the 3 months preceding the claim.</p>

      <h2>10. Changes to these Terms</h2>
      <p>We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>

      <h2>11. Contact</h2>
      <p>Questions about these Terms can be sent to <a href="mailto:info@findthegrant.com">info@findthegrant.com</a>.</p>
    </LegalPageLayout>
  );
}
