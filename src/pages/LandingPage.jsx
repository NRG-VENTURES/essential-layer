import Header from '../components/Header';
import Footer from '../components/Footer';
import RevealSection from '../components/RevealSection';

export default function LandingPage() {
  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <Header />

      <main id="top">
        <RevealSection className="section hero">
          <p className="eyebrow">Essential Layer + Cottonique</p>
          <h1>Built to serve people. Driven by purpose.</h1>
          <p className="lead">
            Essential Layer is incorporated in San Francisco, California and in
            the Philippines. Through our brand Cottonique, we manufacture
            certified organic garments in the Philippines inside a PEZA zone in
            Carmona, Cavite — serving people whose lives are improved by better
            clothing.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#impact">Our Impact</a>
            <a className="btn btn-secondary" href="https://www.cottonique.com" target="_blank" rel="noopener noreferrer">
              Visit Cottonique
            </a>
          </div>
          <div className="hero-metrics">
            <article>
              <h2>US + Philippines</h2>
              <p>Dual-country incorporation and operations.</p>
            </article>
            <article>
              <h2>PEZA Carmona, Cavite</h2>
              <p>Purpose-built garment manufacturing in the Philippines.</p>
            </article>
            <article>
              <h2>B Corp + GOTS</h2>
              <p>Certified standards for impact, accountability, and organic quality.</p>
            </article>
          </div>
        </RevealSection>

        <RevealSection id="story" className="section panel">
          <p className="eyebrow">Why We Exist</p>
          <h2>Cottonique has changed lives, and that keeps us improving every day.</h2>
          <p>
            The people who rely on our products are the reason we exist. Customer
            stories and reviews from Cottonique users reflect real life-changing
            outcomes. That impact gives our founders and employees a clear mission:
            keep improving products so we can serve even better.
          </p>
          <p>
            We are proud to wave the flag of a Benefit Corporation and show that
            business can be built around service, dignity, and long-term value for
            people.
          </p>
        </RevealSection>

        <RevealSection id="certifications" className="section">
          <p className="eyebrow">Verified Standards</p>
          <h2>Certifications that back our commitment</h2>
          <p className="lead">
            We believe certifications should be verifiable. Click through to confirm our standing with each certifying body.
          </p>
          <div className="grid-three">
            <article className="card">
              <h3>B Corp Certified</h3>
              <p>
                Essential Layer is B Corp Certified and operates as a Benefit
                Corporation with accountability to people, community, and purpose.
              </p>
              <a className="card-link" href="https://www.bcorporation.net/en-us/find-a-b-corp/company/essential-layer/" target="_blank" rel="noopener noreferrer">
                Verify on B Corp Directory &rarr;
              </a>
            </article>
            <article className="card">
              <h3>GOTS Certified</h3>
              <p>
                Cottonique products are made under GOTS-certified standards,
                ensuring our organic garments meet the highest global textile criteria
                from raw material harvesting through manufacturing.
              </p>
              <a className="card-link" href="https://global-standard.org/find-suppliers-shops/certified-suppliers/search" target="_blank" rel="noopener noreferrer">
                Verify on GOTS Database &rarr;
              </a>
            </article>
            <article className="card">
              <h3>Benefit Corporation</h3>
              <p>
                Beyond B Corp certification, Essential Layer is legally registered
                as a Benefit Corporation — meaning our purpose-driven mission is
                written into our corporate charter.
              </p>
            </article>
          </div>
        </RevealSection>

        <RevealSection id="operations" className="section split">
          <div>
            <p className="eyebrow">How We Operate</p>
            <h2>From San Francisco to the Philippines, one mission.</h2>
            <p>
              Essential Layer connects global leadership with hands-on
              manufacturing in the Philippines. This structure gives Cottonique
              speed, quality control, and alignment with our values at every step.
            </p>
            <p>
              We design and produce garments for people who experience meaningful
              daily benefits from what they wear, and we continue to refine every
              product based on real customer needs.
            </p>
          </div>
          <div className="stat-panel">
            <article>
              <p className="landing-stat-number">3</p>
              <p className="stat-label">Founding brothers</p>
            </article>
            <article>
              <p className="landing-stat-number">2</p>
              <p className="stat-label">Countries incorporated</p>
            </article>
            <article>
              <p className="landing-stat-number">1</p>
              <p className="stat-label">Purpose: to serve people better</p>
            </article>
          </div>
        </RevealSection>

        <RevealSection id="transparency" className="section panel">
          <p className="eyebrow">Supply Chain Transparency</p>
          <h2>Where our garments come from, and how they're made.</h2>
          <div className="transparency-grid">
            <article className="transparency-item">
              <h3>Materials Sourcing</h3>
              <p>
                Cottonique garments are made from 100% organic cotton, sourced
                under GOTS-certified supply chains. We trace our materials from
                farm to finished product to ensure every fiber meets our standards.
              </p>
            </article>
            <article className="transparency-item">
              <h3>Manufacturing</h3>
              <p>
                Our garments are produced in our own facility inside a PEZA
                (Philippine Economic Zone Authority) zone in Carmona, Cavite,
                Philippines. Operating our own facility gives us direct oversight
                over working conditions, quality, and environmental practices.
              </p>
            </article>
            <article className="transparency-item">
              <h3>Labor Practices</h3>
              <p>
                As a B Corp Certified company, we meet rigorous standards for
                worker well-being. Our team in the Philippines works in safe,
                dignified conditions with fair compensation. We believe the people
                who make our garments deserve the same care as those who wear them.
              </p>
            </article>
            <article className="transparency-item">
              <h3>Environmental Responsibility</h3>
              <p>
                GOTS certification covers not only the organic status of our
                materials but also our environmental practices — including water
                treatment, energy use, and waste management throughout production.
              </p>
            </article>
          </div>
        </RevealSection>

        <RevealSection id="founders" className="section">
          <p className="eyebrow">Founders</p>
          <h2>Nikhiel, Vinesh, and Shawn Genomal</h2>
          <p className="lead">
            Three brothers united by one responsibility: build products that
            improve lives and keep raising the standard.
          </p>
          <div className="founder-grid">
            <article className="founder-card">
              <h3>Nikhiel Genomal</h3>
              <p className="founder-title">Co-Founder &amp; Managing Director</p>
              <p>
                Nikhiel leads the company's long-term vision, purpose alignment,
                and impact strategy. He ensures that Essential Layer's growth
                always stays connected to the people we serve.
              </p>
            </article>
            <article className="founder-card">
              <h3>Vinesh Genomal</h3>
              <p className="founder-title">Co-Founder &amp; Product Lead</p>
              <p>
                Vinesh drives product excellence at Cottonique, working directly
                with customers and the production team to ensure every garment
                meets the highest standards of quality and comfort.
              </p>
            </article>
            <article className="founder-card">
              <h3>Shawn Genomal</h3>
              <p className="founder-title">Co-Founder &amp; Operations Lead</p>
              <p>
                Shawn oversees day-to-day operations and manufacturing quality,
                ensuring our facility in the Philippines runs efficiently while
                maintaining our commitment to worker well-being and continuous
                improvement.
              </p>
            </article>
          </div>
        </RevealSection>

        <RevealSection id="impact" className="section panel">
          <p className="eyebrow">Impact &amp; Customer Stories</p>
          <h2>We exist for the people who benefit from our products.</h2>
          <p>
            Cottonique users consistently share how our garments make day-to-day
            life more comfortable and manageable. Their stories shape our roadmap,
            our standards, and our responsibility to keep improving.
          </p>
          <div className="testimonial-grid">
            <blockquote className="testimonial-card">
              <p>
                &ldquo;I have extremely sensitive skin and Cottonique is the only
                brand I can wear without irritation. These garments have genuinely
                changed my daily life.&rdquo;
              </p>
              <cite>— Cottonique Customer</cite>
            </blockquote>
            <blockquote className="testimonial-card">
              <p>
                &ldquo;After years of searching for clothing that doesn't trigger
                my allergies, I finally found Cottonique. I can't recommend them
                enough.&rdquo;
              </p>
              <cite>— Cottonique Customer</cite>
            </blockquote>
          </div>
          <a className="btn btn-primary" href="https://www.cottonique.com" target="_blank" rel="noopener noreferrer">
            Read More Customer Stories on Cottonique
          </a>
        </RevealSection>

        <RevealSection id="contact" className="section">
          <p className="eyebrow">Get In Touch</p>
          <h2>We'd love to hear from you.</h2>
          <p className="lead">
            Whether you're a customer, partner, retailer, or just curious about what we do — reach out.
            We believe in open communication and we'll get back to you promptly.
          </p>
          <div className="contact-grid">
            <article className="card">
              <h3>United States</h3>
              <p>Essential Layer Inc.</p>
              <p>San Francisco, California</p>
              <p><a href="mailto:info@essentiallayer.com">info@essentiallayer.com</a></p>
            </article>
            <article className="card">
              <h3>Philippines</h3>
              <p>Essential Layer Manufacturing</p>
              <p>PEZA Zone, Carmona, Cavite</p>
              <p><a href="mailto:info@essentiallayer.com">info@essentiallayer.com</a></p>
            </article>
            <article className="card">
              <h3>Cottonique Shop</h3>
              <p>For product inquiries, orders, and support:</p>
              <p><a href="https://www.cottonique.com" target="_blank" rel="noopener noreferrer">www.cottonique.com</a></p>
            </article>
          </div>
        </RevealSection>
      </main>

      <Footer />
    </>
  );
}
