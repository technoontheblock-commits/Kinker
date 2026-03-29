import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | KINKER Basel',
  description: 'Datenschutzerklärung der KNKR GmbH',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">PRIVACY POLICY</h1>
        
        <div className="space-y-10 text-white/80">
          
          <section>
            <p className="text-white/60 mb-4">Last updated: March 29, 2026</p>
            <p className="leading-relaxed">
              KNKR GmbH («KINKER», «we», «us», or «our») operates the website kinker.ch. 
              This page informs you of our policies regarding the collection, use, and disclosure 
              of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          {/* Data Controller */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Data Controller</h2>
            <div className="space-y-2">
              <p><strong>KNKR GmbH</strong></p>
              <p>Barcelona-Strasse 4</p>
              <p>4142 Münchenstein</p>
              <p>Switzerland</p>
              <p className="pt-2">Email: <a href="mailto:info@kinker.ch" className="text-red-500 hover:text-red-400">info@kinker.ch</a></p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Information We Collect</h2>
            <p className="mb-4">We collect several different types of information for various purposes to provide and improve our Service to you:</p>
            
            <h3 className="text-lg font-medium text-white mb-2">Personal Data</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Email address</li>
              <li>First name and last name</li>
              <li>Phone number</li>
              <li>Address, State, Province, ZIP/Postal code, City</li>
              <li>Cookies and Usage Data</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-2 mt-4">Usage Data</h3>
            <p className="leading-relaxed">
              We may also collect information on how the Service is accessed and used (&quot;Usage Data&quot;). 
              This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), 
              browser type, browser version, the pages of our Service that you visit, the time and date of your visit, 
              the time spent on those pages, unique device identifiers and other diagnostic data.
            </p>

            <h3 className="text-lg font-medium text-white mb-2 mt-4">Tracking & Cookies Data</h3>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to track the activity on our Service and 
              hold certain information. Cookies are files with small amount of data which may include an 
              anonymous unique identifier.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="mb-4">KNKR GmbH uses the collected data for various purposes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
              <li>To provide you with news, special offers and general information about other goods, 
                  services and events which we offer that are similar to those that you have already 
                  purchased or enquired about unless you have opted not to receive such information</li>
            </ul>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Legal Basis for Processing</h2>
            <p className="leading-relaxed">
              Under the Swiss Federal Act on Data Protection (FADP) and the EU General Data Protection 
              Regulation (GDPR), we process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-4">
              <li><strong>Performance of a contract:</strong> Processing is necessary for the performance 
                  of a contract to which you are a party (e.g., ticket purchases)</li>
              <li><strong>Legitimate interests:</strong> Processing is necessary for our legitimate interests, 
                  such as improving our services and security</li>
              <li><strong>Consent:</strong> You have given consent to the processing of your personal data 
                  for one or more specific purposes (e.g., newsletter subscription)</li>
              <li><strong>Legal obligation:</strong> Processing is necessary for compliance with a legal 
                  obligation to which we are subject</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Data Retention</h2>
            <p className="leading-relaxed">
              KNKR GmbH will retain your Personal Data only for as long as is necessary for the purposes 
              set out in this Privacy Policy. We will retain and use your Personal Data to the extent 
              necessary to comply with our legal obligations (for example, if we are required to retain 
              your data to comply with applicable laws), resolve disputes, and enforce our legal agreements 
              and policies.
            </p>
            <p className="leading-relaxed mt-4">
              Usage Data is generally retained for a shorter period of time, except when this data is used 
              to strengthen the security or to improve the functionality of our Service, or we are legally 
              obligated to retain this data for longer time periods.
            </p>
          </section>

          {/* Your Data Protection Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Your Data Protection Rights</h2>
            <p className="mb-4">Under applicable data protection laws, you have the following rights:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Right to access:</strong> You have the right to request copies of your personal data.</li>
              <li><strong>Right to rectification:</strong> You have the right to request that we correct 
                  any information you believe is inaccurate or complete information you believe is incomplete.</li>
              <li><strong>Right to erasure:</strong> You have the right to request that we erase your 
                  personal data, under certain conditions.</li>
              <li><strong>Right to restrict processing:</strong> You have the right to request that we 
                  restrict the processing of your personal data, under certain conditions.</li>
              <li><strong>Right to object to processing:</strong> You have the right to object to our 
                  processing of your personal data, under certain conditions.</li>
              <li><strong>Right to data portability:</strong> You have the right to request that we transfer 
                  the data that we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              If you make a request, we have one month to respond to you. If you would like to exercise 
              any of these rights, please contact us at <a href="mailto:info@kinker.ch" className="text-red-500 hover:text-red-400">info@kinker.ch</a>.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Security of Data</h2>
            <p className="leading-relaxed">
              The security of your data is important to us, but remember that no method of transmission 
              over the Internet, or method of electronic storage is 100% secure. While we strive to use 
              commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Service Providers */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Service Providers</h2>
            <p className="leading-relaxed">
              We may employ third party companies and individuals to facilitate our Service («Service Providers»), 
              to provide the Service on our behalf, to perform Service-related services or to assist us in 
              analyzing how our Service is used.
            </p>
            <p className="leading-relaxed mt-4">
              These third parties have access to your Personal Data only to perform these tasks on our behalf 
              and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>

          {/* Links to Other Sites */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Links to Other Sites</h2>
            <p className="leading-relaxed">
              Our Service may contain links to other sites that are not operated by us. If you click on 
              a third party link, you will be directed to that third party&apos;s site. We strongly advise you 
              to review the Privacy Policy of every site you visit.
            </p>
            <p className="leading-relaxed mt-4">
              We have no control over and assume no responsibility for the content, privacy policies or 
              practices of any third party sites or services.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Children&apos;s Privacy</h2>
            <p className="leading-relaxed">
              Our Service is intended for users who are at least 18 years old. We do not knowingly collect 
              personally identifiable information from anyone under the age of 18. If you are a parent or 
              guardian and you are aware that your child has provided us with Personal Data, please contact us.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Changes to This Privacy Policy</h2>
            <p className="leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page.
            </p>
            <p className="leading-relaxed mt-4">
              You are advised to review this Privacy Policy periodically for any changes. Changes to this 
              Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="mb-4">If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="space-y-2">
              <p><strong>By email:</strong> <a href="mailto:info@kinker.ch" className="text-red-500 hover:text-red-400">info@kinker.ch</a></p>
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
