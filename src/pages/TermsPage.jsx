import Header from '../components/Header';
import Footer from '../components/Footer';
import RevealSection from '../components/RevealSection';

export default function TermsPage() {
  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <Header isSubpage />

      <main>
        <RevealSection className="section panel legal-page">
          <p className="eyebrow">Legal</p>
          <h1>Terms of Service</h1>
          <p className="legal-updated">Last updated: March 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the Essential Layer website (essentiallayer.com),
            you accept and agree to be bound by these Terms of Service. If you do not
            agree to these terms, please do not use our website.
          </p>

          <h2>2. About Essential Layer</h2>
          <p>
            Essential Layer Inc. is a Benefit Corporation incorporated in San Francisco,
            California, and in the Philippines. We manufacture certified organic garments
            under our brand Cottonique. This website provides information about our company,
            our mission, and our products.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            All content on this website — including text, graphics, logos, images, and
            software — is the property of Essential Layer Inc. or its content suppliers
            and is protected by United States and international intellectual property laws.
            "Essential Layer" and "Cottonique" are trademarks of Essential Layer Inc.
          </p>

          <h2>4. Use of Website</h2>
          <p>You agree to use this website only for lawful purposes and in a way that does not:</p>
          <ul>
            <li>Infringe the rights of others or restrict their use of the website</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Transmit any harmful, threatening, or objectionable material</li>
            <li>Attempt to gain unauthorized access to any part of the website</li>
          </ul>

          <h2>5. Product Information</h2>
          <p>
            Product information displayed on this website is for general informational
            purposes. For specific product details, purchasing, and customer support,
            please visit <a href="https://www.cottonique.com" target="_blank" rel="noopener noreferrer">cottonique.com</a>.
            We make every effort to ensure accuracy but do not warrant that product
            descriptions or other content on this site are error-free.
          </p>

          <h2>6. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites, including certification
            bodies, partners, and our Cottonique brand site. These links are provided for
            your convenience. Essential Layer does not endorse and is not responsible for
            the content or practices of any linked third-party sites.
          </p>

          <h2>7. Disclaimer of Warranties</h2>
          <p>
            This website is provided on an "as is" and "as available" basis. Essential Layer
            makes no representations or warranties of any kind, express or implied, regarding
            the operation of the website or the information, content, or materials included
            on this site.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, Essential Layer Inc. shall
            not be liable for any indirect, incidental, special, consequential, or punitive
            damages arising out of or related to your use of this website.
          </p>

          <h2>9. Governing Law</h2>
          <p>
            These Terms of Service are governed by and construed in accordance with the
            laws of the State of California, without regard to its conflict of law provisions.
            Any disputes shall be resolved in the courts of San Francisco, California.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. Changes
            will be effective immediately upon posting to this website. Your continued use
            of the website after changes are posted constitutes acceptance of the modified terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            If you have questions about these Terms of Service, please contact us:
          </p>
          <p>
            Essential Layer Inc.<br />
            San Francisco, California<br />
            <a href="mailto:info@essentiallayer.com">info@essentiallayer.com</a>
          </p>
        </RevealSection>
      </main>

      <Footer minimal />
    </>
  );
}
