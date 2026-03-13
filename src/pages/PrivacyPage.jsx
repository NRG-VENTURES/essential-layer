import Header from '../components/Header';
import Footer from '../components/Footer';
import RevealSection from '../components/RevealSection';

export default function PrivacyPage() {
  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <Header isSubpage />

      <main>
        <RevealSection className="section panel legal-page">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: March 2026</p>

          <h2>1. Introduction</h2>
          <p>
            Essential Layer Inc. ("Essential Layer," "we," "us," or "our") respects your
            privacy and is committed to protecting your personal information. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your information
            when you visit our website essentiallayer.com and any related services.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <p>
            We may collect personal information that you voluntarily provide when you
            contact us, including your name, email address, phone number, and any other
            information you choose to share in your communications with us.
          </p>
          <h3>Automatically Collected Information</h3>
          <p>
            When you visit our website, we may automatically collect certain information
            about your device, including your IP address, browser type, operating system,
            referring URLs, and information about how you interact with our website. We
            may use cookies and similar tracking technologies to collect this information.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Respond to your inquiries and communications</li>
            <li>Improve and optimize our website and services</li>
            <li>Comply with legal obligations</li>
            <li>Protect against fraudulent or unauthorized activity</li>
          </ul>

          <h2>4. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties.
            We may share your information with trusted service providers who assist us
            in operating our website, conducting our business, or servicing you — provided
            those parties agree to keep this information confidential. We may also disclose
            your information when required by law or to protect our rights.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your
            personal information against unauthorized access, alteration, disclosure, or
            destruction. However, no method of transmission over the Internet or electronic
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have rights regarding your personal
            information, including the right to access, correct, or delete your data.
            California residents may have additional rights under the CCPA. To exercise
            any of these rights, please contact us at the email address below.
          </p>

          <h2>7. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites, including
            cottonique.com, certification bodies, and social media platforms. We are
            not responsible for the privacy practices of these external sites. We
            encourage you to review their privacy policies.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our website is not directed to children under the age of 13, and we do not
            knowingly collect personal information from children under 13.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            any changes by posting the new Privacy Policy on this page and updating the
            "Last updated" date.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices,
            please contact us:
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
