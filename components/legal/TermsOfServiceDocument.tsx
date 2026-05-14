import Link from "next/link";

export function TermsOfServiceDocument() {
  return (
    <div className="space-y-10 text-sm leading-relaxed text-stone-700">
      <header className="space-y-2 border-b border-border-subtle pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Brook Planner Terms of Service</h1>
        <dl className="grid gap-1 text-stone-600 sm:grid-cols-2 sm:gap-x-8">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Effective date</dt>
            <dd>05/04/2026</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Company</dt>
            <dd>Brook Planner (&ldquo;Brook Planner,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Location</dt>
            <dd>Brooklyn, New York, USA</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Brook Planner (the &ldquo;Platform&rdquo;), you agree to be bound by these Terms of
          Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">2. Description of Service</h2>
        <p>
          Brook Planner is an online marketplace that connects event hosts (&ldquo;Customers&rdquo;) with independent
          event vendors (&ldquo;Vendors&rdquo;). Customers may post event requests, and Vendors may submit quotes.
        </p>
        <p>
          Brook Planner does not provide event services, does not employ Vendors, and is not a party to any agreements
          between Customers and Vendors.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">3. Eligibility</h2>
        <p>You must be at least 18 years old and able to form a binding contract to use the Platform.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">4. User Accounts</h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>You agree to provide accurate, current, and complete information.</li>
          <li>You are responsible for maintaining the confidentiality of your account.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">5. Marketplace Role &amp; No Agency</h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>Brook Planner acts solely as a technology platform facilitating introductions.</li>
          <li>We do not endorse or guarantee any Vendor or Customer.</li>
          <li>We do not supervise, control, or direct Vendors&rsquo; work.</li>
          <li>We are not an agent, partner, or employer of any user.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">6. Customer Responsibilities</h2>
        <p>Customers agree to:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>Provide accurate event details.</li>
          <li>Evaluate Vendors independently.</li>
          <li>Enter into agreements directly with Vendors.</li>
          <li>Pay Vendors directly outside the Platform (unless otherwise introduced in future features).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">7. Vendor Responsibilities</h2>
        <p>Vendors agree to:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>Provide accurate business and service information.</li>
          <li>Submit honest and lawful quotes.</li>
          <li>Communicate professionally with Customers.</li>
          <li>Comply with all applicable laws, licenses, and permits.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">8. Payments &amp; Transactions</h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>All pricing, deposits, and payments are handled directly between Customers and Vendors.</li>
          <li>Brook Planner does not process or hold funds for services (unless explicitly stated in future features).</li>
          <li>Brook Planner is not responsible for payment disputes.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">9. Credits &amp; Fees (Vendor Side)</h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>Brook Planner may charge Vendors for access to opportunities (e.g., credits to submit quotes).</li>
          <li>Fees are for access to the Platform, not for guaranteed work.</li>
          <li>Fees are generally non-refundable, except where required by law or explicitly stated.</li>
          <li>We may modify pricing at any time with notice.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">10. Quotes &amp; No Guarantee</h2>
        <p>Customers may receive up to a limited number of quotes per category.</p>
        <p>Brook Planner does not guarantee:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>the number of quotes received,</li>
          <li>that a Vendor will be selected,</li>
          <li>or that any project will be completed.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">11. User Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>Use the Platform for unlawful purposes</li>
          <li>Submit false or misleading information</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Circumvent Platform rules or fees</li>
          <li>Attempt to interfere with Platform functionality</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">12. Content &amp; Submissions</h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>You retain ownership of content you submit.</li>
          <li>You grant Brook Planner a license to use, display, and distribute your content on the Platform.</li>
          <li>You are responsible for the legality and accuracy of your content.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">13. Disputes Between Users</h2>
        <p>Any disputes are solely between Customers and Vendors.</p>
        <p>Brook Planner:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>Is not responsible for disputes, damages, or losses</li>
          <li>Has no obligation to mediate or resolve disputes</li>
          <li>May, at its discretion, review or restrict accounts involved in misconduct</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">14. No Warranty</h2>
        <p>
          The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; Brook Planner disclaims all
          warranties, including:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>merchantability</li>
          <li>fitness for a particular purpose</li>
          <li>non-infringement</li>
        </ul>
        <p>We do not guarantee:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>uninterrupted access</li>
          <li>error-free operation</li>
          <li>accuracy of user content</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">15. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <p>Brook Planner shall not be liable for any indirect, incidental, special, or consequential damages, including:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>loss of profits</li>
          <li>loss of data</li>
          <li>business interruption</li>
          <li>damages arising from interactions between users</li>
        </ul>
        <p>
          Our total liability shall not exceed the amount paid to Brook Planner by you (if any) in the last 12 months.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">16. Indemnification</h2>
        <p>You agree to indemnify and hold harmless Brook Planner from any claims, damages, liabilities, and expenses arising from:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>your use of the Platform</li>
          <li>your violation of these Terms</li>
          <li>your interactions with other users</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">17. Termination</h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>We may suspend or terminate your account at any time if you violate these Terms.</li>
          <li>You may stop using the Platform at any time.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">18. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">19. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of New York, without regard to conflict of law principles.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">20. Contact</h2>
        <p className="font-medium text-brand-navy">Brook Planner</p>
        <p>Brooklyn, New York</p>
        <p>
          Email:{" "}
          <a
            href="mailto:support@brookplanner.com"
            className="font-semibold text-accent-blue underline-offset-2 hover:underline"
          >
            support@brookplanner.com
          </a>
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border-subtle bg-brand-navy/[0.04] p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-navy">21. Acknowledgment</h2>
        <p>
          Your use of the Platform is subject to these Terms of Service and our{" "}
          <Link
            href="/privacy"
            className="font-semibold text-brand-navy underline underline-offset-2 transition-colors hover:text-brand-navy-hover"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p>By using Brook Planner, you acknowledge that you understand and agree that:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brand-navy">
          <li>Brook Planner is a marketplace only</li>
          <li>All services are performed by independent Vendors</li>
          <li>All transactions occur directly between users</li>
          <li>Brook Planner is not responsible for services or payments</li>
        </ul>
      </section>
    </div>
  );
}
