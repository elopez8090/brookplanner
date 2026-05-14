export function PrivacyPolicyDocument() {
  return (
    <div className="space-y-10 text-sm leading-relaxed text-stone-700">
      <header className="space-y-2 border-b border-border-subtle pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
          Brook Planner Privacy Policy
        </h1>
        <dl className="grid gap-1 text-stone-600 sm:grid-cols-2 sm:gap-x-8">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Effective date</dt>
            <dd>05/04/2026</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-3">
        <p>
          Brook Planner (&ldquo;Brook Planner,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects
          your privacy. This Privacy Policy explains how we collect, use, and protect information when you use our
          platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">1. Information We Collect</h2>
        <p>We may collect the following information:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Name</li>
          <li>Email address</li>
          <li>Account type, such as customer or vendor</li>
          <li>Event details submitted by customers</li>
          <li>Business information submitted by vendors</li>
          <li>Messages, quotes, or platform activity</li>
          <li>
            Payment-related information for vendor credit purchases, processed by third-party payment providers
          </li>
          <li>Device, browser, and usage information</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">2. How We Use Information</h2>
        <p>We use information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and manage user accounts</li>
          <li>Allow customers to post events</li>
          <li>Allow vendors to submit quotes</li>
          <li>Connect customers with independent vendors</li>
          <li>Improve the platform and user experience</li>
          <li>Communicate important account or service updates</li>
          <li>Prevent fraud, abuse, or misuse</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">3. Marketplace Information Sharing</h2>
        <p>
          Brook Planner is a marketplace connecting customers and independent vendors.
        </p>
        <p>
          When a customer posts an event or interacts with a vendor, certain event details may be shared with vendors so
          they can review the opportunity and submit quotes.
        </p>
        <p>
          When a vendor submits a quote, relevant vendor information may be shared with the customer.
        </p>
        <p>Brook Planner does not sell personal information.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">4. Payments</h2>
        <p>
          Brook Planner may use third-party payment processors to handle vendor credit purchases. We do not store full
          payment card details on our servers.
        </p>
        <p>Payment processing is subject to the privacy policies and terms of the payment provider.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">5. Cookies and Tracking</h2>
        <p>We may use cookies or similar technologies to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Keep users logged in</li>
          <li>Improve site performance</li>
          <li>Understand how users interact with the platform</li>
          <li>Support security and fraud prevention</li>
        </ul>
        <p>
          Users may adjust browser settings to limit cookies, but some platform features may not work properly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">6. Data Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect user information. However, no method of
          transmission or storage is completely secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">7. User Responsibilities</h2>
        <p>
          Users are responsible for the information they choose to share with other users. Customers and vendors should use
          caution before entering into agreements, making payments, or sharing sensitive information outside the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">8. Third-Party Services</h2>
        <p>
          Brook Planner may use third-party services for hosting, authentication, analytics, payments, email, or other
          platform functions. These services may process information according to their own policies.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">9. Data Retention</h2>
        <p>
          We may retain user information as long as necessary to operate the platform, comply with legal obligations,
          resolve disputes, and enforce agreements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">10. Children&apos;s Privacy</h2>
        <p>
          Brook Planner is not intended for users under 18. We do not knowingly collect information from children under
          18.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">11. Your Choices</h2>
        <p>
          Users may contact Brook Planner to request account updates or deletion, subject to legal and operational
          requirements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">12. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Continued use of the platform after updates means you
          accept the revised policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-brand-navy">13. Contact</h2>
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
    </div>
  );
}
