import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | KINKER',
  description: 'Datenschutzerklärung / Privacy Policy of KNKR GmbH',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">PRIVACY POLICY</h1>
        <p className="text-white/40 mb-12 text-sm">Last updated: 3 June 2026</p>

        <div className="space-y-12 text-white/80">

          {/* 1. Overview */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Overview</h2>
            <p className="leading-relaxed mb-4">
              KNKR GmbH («KINKER», «we», «us», or «our») operates the website{' '}
              <a href="https://knkr.ch" className="text-red-500 hover:text-red-400">knkr.ch</a>. 
              We take the protection of your personal data very seriously. This Privacy Policy 
              informs you in accordance with the EU General Data Protection Regulation (GDPR) 
              and the Swiss Federal Act on Data Protection (nFADP) about the processing of your 
              personal data when you use our services.
            </p>
            <p className="leading-relaxed">
              This policy applies to all processing of personal data in connection with our website, 
              ticket shop, merchandise store, user accounts, newsletter, and VIP bookings.
            </p>
          </section>

          {/* 2. Data Controller */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Data Controller</h2>
            <div className="space-y-2">
              <p><strong>KNKR GmbH</strong></p>
              <p>Barcelona-Strasse 4</p>
              <p>4142 Münchenstein</p>
              <p>Switzerland</p>
              <p className="pt-2">Email: <a href="mailto:info@knkr.ch" className="text-red-500 hover:text-red-400">info@knkr.ch</a></p>
              <p>Commercial Register: CHE-491.863.600</p>
            </div>
            <p className="leading-relaxed mt-4">
              <strong>Data Protection Officer (DPO):</strong> We are not legally required to appoint 
              a DPO under Art. 37 GDPR. For data protection inquiries, please contact us at{' '}
              <a href="mailto:info@knkr.ch" className="text-red-500 hover:text-red-400">info@knkr.ch</a>.
            </p>
          </section>

          {/* 3. What Data We Collect and Why */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. What Data We Collect and Why</h2>
            <p className="leading-relaxed mb-4">
              We process personal data only for specific, explicit, and legitimate purposes. 
              The following table provides an overview of the data we collect, the purposes, 
              and the legal bases under Art. 6 GDPR:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Purpose</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Data Categories</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Legal Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3 align-top">Website operation & security</td>
                    <td className="p-3 align-top">IP address, browser type, device info, session cookies</td>
                    <td className="p-3 align-top">Art. 6(1)(f) GDPR (legitimate interest: fraud prevention, security)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">User account creation & login</td>
                    <td className="p-3 align-top">Name, email, password (hashed), phone (optional), avatar (optional)</td>
                    <td className="p-3 align-top">Art. 6(1)(b) GDPR (contract)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">Ticket & merchandise purchases</td>
                    <td className="p-3 align-top">Name, email, phone, billing/shipping address, payment reference, order history</td>
                    <td className="p-3 align-top">Art. 6(1)(b) GDPR (contract)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">Payment processing</td>
                    <td className="p-3 align-top">Payment data is processed directly by our payment providers; we only receive payment status & reference</td>
                    <td className="p-3 align-top">Art. 6(1)(b) GDPR (contract)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">Merchandise fulfillment (Printful)</td>
                    <td className="p-3 align-top">Name, shipping address, email, phone, order items</td>
                    <td className="p-3 align-top">Art. 6(1)(b) GDPR (contract)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">Newsletter</td>
                    <td className="p-3 align-top">Email address, subscription timestamp, consent record</td>
                    <td className="p-3 align-top">Art. 6(1)(a) GDPR (consent)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">VIP room booking</td>
                    <td className="p-3 align-top">User ID, selected event, package, special requests</td>
                    <td className="p-3 align-top">Art. 6(1)(b) GDPR (contract)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">Loyalty program (rewards)</td>
                    <td className="p-3 align-top">Points balance, tier level, purchase history references</td>
                    <td className="p-3 align-top">Art. 6(1)(b) GDPR (contract) / Art. 6(1)(a) (consent, if profiling)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">Customer support</td>
                    <td className="p-3 align-top">Name, email, order details, correspondence</td>
                    <td className="p-3 align-top">Art. 6(1)(b) GDPR (contract) / Art. 6(1)(f) (legitimate interest)</td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">Website analytics</td>
                    <td className="p-3 align-top">Anonymized performance metrics (only with your consent)</td>
                    <td className="p-3 align-top">Art. 6(1)(a) GDPR (consent)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Cookies & Tracking */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Cookies and Similar Technologies</h2>
            <p className="leading-relaxed mb-4">
              We use cookies and similar technologies. Cookies are small text files stored on your device. 
              You can manage your preferences via the cookie banner or the &quot;Cookie Settings&quot; link in the footer.
            </p>

            <h3 className="text-lg font-medium text-white mb-2">4.1 Necessary Cookies</h3>
            <p className="leading-relaxed mb-4">
              These cookies are essential for the website to function and cannot be disabled. 
              They are set based on Art. 6(1)(b) GDPR (contract performance) or Art. 6(1)(f) GDPR 
              (legitimate interest in secure operation).
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Name</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Purpose</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3 font-mono text-xs">user_session</td>
                    <td className="p-3">Authentication and user session management</td>
                    <td className="p-3">7 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">session_id</td>
                    <td className="p-3">Shopping cart functionality for non-logged-in users</td>
                    <td className="p-3">30 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-white mb-2">4.2 Analytics Cookies (Consent Required)</h3>
            <p className="leading-relaxed mb-4">
              These cookies are only set with your explicit consent (Art. 6(1)(a) GDPR). 
              You can revoke your consent at any time via the Cookie Settings.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Provider</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Purpose</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3">Vercel Speed Insights</td>
                    <td className="p-3">Page performance measurement and Core Web Vitals tracking</td>
                    <td className="p-3">Anonymized performance metrics (no personal data)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Data Recipients & Third Parties */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Recipients and Third-Party Processors</h2>
            <p className="leading-relaxed mb-4">
              We only share your data with third parties when necessary for the purposes stated above 
              or when legally required. All processors are contractually bound by Data Processing Agreements 
              (Art. 28 GDPR).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Processor</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Location</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Purpose</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Legal Basis for Transfer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3">Supabase Inc.</td>
                    <td className="p-3">USA</td>
                    <td className="p-3">Database hosting, user authentication, data storage</td>
                    <td className="p-3">Standard Contractual Clauses (SCC) Art. 46(2)(c) GDPR</td>
                  </tr>
                  <tr>
                    <td className="p-3">Resend Inc.</td>
                    <td className="p-3">USA</td>
                    <td className="p-3">Transactional emails (order confirmations, verification)</td>
                    <td className="p-3">Standard Contractual Clauses (SCC) Art. 46(2)(c) GDPR</td>
                  </tr>
                  <tr>
                    <td className="p-3">Vercel Inc.</td>
                    <td className="p-3">USA</td>
                    <td className="p-3">Website hosting, Edge network delivery</td>
                    <td className="p-3">EU-U.S. Data Privacy Framework (DPF) certified + SCC</td>
                  </tr>
                  <tr>
                    <td className="p-3">Printful LLC</td>
                    <td className="p-3">Latvia (EU) / USA</td>
                    <td className="p-3">Merchandise printing, packaging, and shipping</td>
                    <td className="p-3">Adequacy decision (Latvia, EU); SCC for USA transfers</td>
                  </tr>
                  <tr>
                    <td className="p-3">Eventfrog AG</td>
                    <td className="p-3">Switzerland</td>
                    <td className="p-3">Event data synchronization (public event information only)</td>
                    <td className="p-3">Adequacy decision (Switzerland)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. International Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. International Data Transfers</h2>
            <p className="leading-relaxed mb-4">
              Some of our processors are located outside the European Economic Area (EEA), particularly 
              in the USA. In such cases, we ensure an adequate level of data protection through:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>EU-U.S. Data Privacy Framework (DPF):</strong> For providers certified under 
                the DPF (e.g., Vercel), data transfers are based on the European Commission&apos;s 
                adequacy decision of 10 July 2023.
              </li>
              <li>
                <strong>Standard Contractual Clauses (SCC):</strong> For providers without DPF certification 
                (e.g., Resend, Supabase), we have concluded EU Commission Standard Contractual Clauses 
                pursuant to Art. 46(2)(c) GDPR. Additional technical safeguards (TLS encryption, 
                access restrictions) are implemented.
              </li>
              <li>
                <strong>Switzerland:</strong> Switzerland has been recognized by the EU Commission as 
                providing an adequate level of data protection (Adequacy Decision 2000/518/EC).
              </li>
            </ul>
          </section>

          {/* 7. Retention Periods */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Data Retention Periods</h2>
            <p className="leading-relaxed mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes 
              for which it was collected or to comply with legal obligations:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Data Category</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Retention Period</th>
                    <th className="text-left p-3 text-white font-medium border-b border-white/10">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3">Account data (active users)</td>
                    <td className="p-3">Until account deletion</td>
                    <td className="p-3">Contract performance</td>
                  </tr>
                  <tr>
                    <td className="p-3">Unverified accounts</td>
                    <td className="p-3">30 days after registration</td>
                    <td className="p-3">Data minimization</td>
                  </tr>
                  <tr>
                    <td className="p-3">Order & payment data</td>
                    <td className="p-3">10 years</td>
                    <td className="p-3">Swiss commercial law (OR 958f), tax obligations</td>
                  </tr>
                  <tr>
                    <td className="p-3">Ticket data</td>
                    <td className="p-3">10 years</td>
                    <td className="p-3">Proof of purchase, tax obligations</td>
                  </tr>
                  <tr>
                    <td className="p-3">Newsletter subscriptions</td>
                    <td className="p-3">Until unsubscribe + 3 years</td>
                    <td className="p-3">Proof of consent</td>
                  </tr>
                  <tr>
                    <td className="p-3">Shopping cart sessions</td>
                    <td className="p-3">30 days</td>
                    <td className="p-3">Technical necessity</td>
                  </tr>
                  <tr>
                    <td className="p-3">Server logs</td>
                    <td className="p-3">30 days</td>
                    <td className="p-3">Security, troubleshooting</td>
                  </tr>
                  <tr>
                    <td className="p-3">Email correspondence</td>
                    <td className="p-3">2 years after last contact</td>
                    <td className="p-3">Legitimate interest (documentation)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="leading-relaxed mt-4">
              After the retention period expires, data is either deleted or anonymized (e.g., 
              replacement of names with &quot;Deleted User&quot; and removal of contact details), unless 
              longer retention is required by law.
            </p>
          </section>

          {/* 8. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Your Data Protection Rights</h2>
            <p className="leading-relaxed mb-4">
              Under the GDPR and the Swiss nFADP, you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right of access (Art. 15 GDPR):</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Right to rectification (Art. 16 GDPR):</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to erasure (Art. 17 GDPR):</strong> Request deletion of your data, subject to legal retention obligations.</li>
              <li><strong>Right to restriction of processing (Art. 18 GDPR):</strong> Request limitation on how we use your data.</li>
              <li><strong>Right to data portability (Art. 20 GDPR):</strong> Receive your data in a structured, commonly used format.</li>
              <li><strong>Right to object (Art. 21 GDPR):</strong> Object to processing based on legitimate interests or direct marketing.</li>
              <li><strong>Right to withdraw consent (Art. 7(3) GDPR):</strong> Withdraw consent at any time without affecting the lawfulness of prior processing.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              <strong>Exercising your rights:</strong> To exercise any of these rights, please contact us at{' '}
              <a href="mailto:info@knkr.ch" className="text-red-500 hover:text-red-400">info@knkr.ch</a>. 
              We will respond within <strong>one month</strong> (extendable by two months for complex requests). 
              Requests are generally free of charge.
            </p>
            <p className="leading-relaxed mt-4">
              <strong>Right to lodge a complaint:</strong> You have the right to lodge a complaint with a 
              supervisory authority, in particular in the EU member state of your habitual residence, 
              place of work, or place of the alleged infringement (Art. 77 GDPR).
            </p>
          </section>

          {/* 9. Security */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Data Security</h2>
            <p className="leading-relaxed mb-4">
              We implement appropriate technical and organizational measures (TOMs) to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Encryption:</strong> All data transmission uses TLS 1.2+ encryption (HTTPS).</li>
              <li><strong>Password security:</strong> Passwords are hashed using bcrypt with a cost factor of 12.</li>
              <li><strong>Two-factor authentication (2FA):</strong> Available for user accounts via TOTP.</li>
              <li><strong>Signed sessions:</strong> User sessions are cryptographically signed with HMAC-SHA256.</li>
              <li><strong>HttpOnly cookies:</strong> Session cookies are not accessible via JavaScript.</li>
              <li><strong>Row Level Security (RLS):</strong> Database access is restricted per user.</li>
              <li><strong>Access controls:</strong> Role-based access for administrative functions.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Despite these measures, no electronic transmission or storage method is 100% secure. 
              We continuously review and improve our security practices.
            </p>
          </section>

          {/* 10. Newsletter */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Newsletter</h2>
            <p className="leading-relaxed mb-4">
              Our newsletter is sent only with your explicit consent (Art. 6(1)(a) GDPR). 
              When you subscribe, we use a <strong>double opt-in</strong> process: After entering 
              your email address, you will receive a confirmation email with a verification link. 
              Only after clicking this link will your subscription be activated.
            </p>
            <p className="leading-relaxed mb-4">
              We store your consent record (timestamp, IP address hashed, confirmation email content) 
              to demonstrate compliance. You can unsubscribe at any time by clicking the unsubscribe 
              link in every newsletter email or by contacting us at{' '}
              <a href="mailto:info@knkr.ch" className="text-red-500 hover:text-red-400">info@knkr.ch</a>.
            </p>
          </section>

          {/* 11. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Children&apos;s Privacy</h2>
            <p className="leading-relaxed">
              Our services are intended for users who are at least <strong>18 years old</strong>. 
              We do not knowingly collect personal data from anyone under 18. If you are a parent 
              or guardian and believe your child has provided us with personal data, please contact 
              us immediately at{' '}
              <a href="mailto:info@knkr.ch" className="text-red-500 hover:text-red-400">info@knkr.ch</a>. 
              We will delete such data promptly.
            </p>
          </section>

          {/* 12. Automated Decision-Making */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Automated Decision-Making and Profiling</h2>
            <p className="leading-relaxed">
              Our loyalty program calculates points and tiers based on your purchase history. 
              This constitutes automated decision-making under Art. 22 GDPR. However, it does not 
              produce legal effects or similarly significantly affect you. The tier calculation 
              is based on objective criteria (points total). You have the right to object to such 
              processing (Art. 21 GDPR) and can contact us to discuss your tier status.
            </p>
          </section>

          {/* 13. Changes */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Changes to This Privacy Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or legal requirements. We will notify you of significant changes by posting the new 
              Privacy Policy on this page and updating the &quot;Last updated&quot; date. For material changes, 
              we may also send you an email notification.
            </p>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Contact Us</h2>
            <p className="leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>By email:</strong> <a href="mailto:info@knkr.ch" className="text-red-500 hover:text-red-400">info@knkr.ch</a></p>
              <p><strong>By mail:</strong></p>
              <p className="ml-4">KNKR GmbH</p>
              <p className="ml-4">Barcelona-Strasse 4</p>
              <p className="ml-4">4142 Münchenstein</p>
              <p className="ml-4">Switzerland</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
