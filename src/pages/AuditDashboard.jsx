import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import '../styles/audit.css';

const TASKS = [
  {
    id: 1, priority: 'urgent', title: 'Enable the Cart Drawer', time: '~ 5 minutes', owner: 'Shopify Admin',
    whatsWrong: 'The cart drawer is disabled. When customers click "Add to Cart," they\'re taken to a separate cart page instead of seeing a slide-out drawer. This adds unnecessary clicks and causes drop-offs.',
    steps: [
      'Log into <strong>Shopify Admin</strong> → Online Store → Themes',
      'Click <strong>"Customize"</strong> on the live Fame theme',
      'Open <strong>Theme Settings</strong> (gear icon, bottom-left)',
      'Navigate to <strong>Cart</strong> section',
      'Change Cart type from <strong>"Page"</strong> to <strong>"Drawer"</strong>',
      'Click <strong>Save</strong>',
    ],
    expected: 'A slide-out cart drawer appears when items are added, allowing customers to continue shopping or proceed to checkout without leaving the page.',
  },
  {
    id: 2, priority: 'urgent', title: 'Add H1 Headings to All Key Pages', time: '~ 30 minutes', owner: 'Theme Developer',
    whatsWrong: 'The homepage and collection pages are missing <code>&lt;h1&gt;</code> heading tags. Google uses H1 as the primary signal for what a page is about. Missing H1 = weaker SEO rankings.',
    steps: [
      'Go to <strong>Shopify Admin</strong> → Online Store → Themes → <strong>Edit Code</strong>',
      'Open <code>index.liquid</code> (or the homepage section file)',
      'Add an H1 tag near the top of the page content',
      'Repeat for each collection template in <code>collection.liquid</code>',
    ],
    example: `<!-- Homepage -->
<h1 class="visually-hidden">
  Hypoallergenic Organic Cotton Clothing for Sensitive Skin
</h1>

<!-- Collection Page -->
<h1>{{ collection.title }}</h1>`,
    exampleLabel: 'Example Code',
  },
  {
    id: 3, priority: 'urgent', title: 'Add Open Graph & Twitter Card Meta Tags', time: '~ 1 hour', owner: 'Theme Developer',
    whatsWrong: 'When someone shares a Cottonique link on Facebook, Instagram, LinkedIn, or Twitter, it shows as a plain text link with <strong>no image preview and no description</strong>. This kills social engagement and looks unprofessional.',
    steps: [
      'Go to <strong>Edit Code</strong> → open <code>theme.liquid</code>',
      'Add the meta tags inside the <code>&lt;head&gt;</code> section',
      'Test with Facebook Sharing Debugger and Twitter Card Validator',
    ],
    example: `<meta property="og:title" content="{{ page_title }}">
<meta property="og:description" content="{{ page_description | escape }}">
<meta property="og:image" content="{{ page_image | img_url: '1200x630' }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page_title }}">
<meta name="twitter:description" content="{{ page_description | escape }}">
<meta name="twitter:image" content="{{ page_image | img_url: '1200x630' }}">`,
    exampleLabel: 'Example Code (add to theme.liquid <head>)',
  },
  {
    id: 4, priority: 'high', title: 'Add Product Schema Markup (JSON-LD)', time: '~ 2 hours', owner: 'Theme Developer',
    whatsWrong: 'Product pages lack structured data. This means Google can\'t show <strong>star ratings, prices, or stock status</strong> in search results. Competitors with rich snippets get significantly higher click-through rates.',
    steps: [
      'Go to <strong>Edit Code</strong> → find the product template (e.g., <code>product.liquid</code> or <code>main-product.liquid</code>)',
      'Add the JSON-LD script block at the bottom of the template',
      'Test with Google Rich Results Test',
    ],
    example: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{ product.title | escape }}",
  "image": "https:{{ product.featured_image | img_url: '1024x' }}",
  "description": "{{ product.description | strip_html | escape }}",
  "sku": "{{ product.selected_or_first_available_variant.sku }}",
  "brand": { "@type": "Brand", "name": "Cottonique" },
  "offers": {
    "@type": "Offer",
    "price": "{{ product.price | money_without_currency }}",
    "priceCurrency": "USD",
    "availability": "https://schema.org/{% if product.available %}InStock{% else %}OutOfStock{% endif %}"
  }
}
</script>`,
    exampleLabel: 'Example Code',
  },
  {
    id: 5, priority: 'high', title: 'Remove Duplicate & Unused Third-Party Scripts', time: '~ 2-3 hours', owner: 'Shopify Admin',
    whatsWrong: 'The site loads <strong>10+ third-party scripts</strong> on every page — including Rebuy Engine loading <strong>twice</strong>. This significantly slows page load and hurts Google Core Web Vitals scores (which affect SEO ranking).',
    scriptsFound: [
      '<strong>Judge.me</strong> — Reviews (keep)',
      '<strong>Klaviyo</strong> — Email marketing (keep, but defer loading)',
      '<strong>Rebuy Engine</strong> — Upsells (LOADED TWICE — fix immediately)',
      '<strong>Globo Filters</strong> — Collection filters (evaluate if needed)',
      '<strong>Boost Sales / Avada</strong> — Pop-ups (evaluate ROI)',
      '<strong>hCaptcha</strong> — Bot protection (keep, lazy-load)',
      '<strong>Various tracking pixels</strong> — Audit which are active',
    ],
    steps: [
      'Go to <strong>Shopify Admin</strong> → Apps → review all installed apps',
      'Remove the <strong>duplicate Rebuy</strong> script (check theme code for hardcoded instances)',
      'For each app, decide: <strong>Keep / Defer / Remove</strong>',
      'Run Google PageSpeed Insights before and after to measure improvement',
    ],
  },
  {
    id: 6, priority: 'high', title: 'Add Trust Badges Near "Add to Cart"', time: '~ 1-2 hours', owner: 'Theme Developer',
    whatsWrong: 'Product pages lack visible trust signals near the purchase button. No payment icons, no security badge, no key selling points. Customers shopping for hypoallergenic products are especially cautious — they need reassurance before buying.',
    whatToAdd: [
      'Payment method icons (Visa, Mastercard, Amex, PayPal)',
      'Security badge ("Secure Checkout" with lock icon)',
      'Key differentiators: "100% Organic Cotton", "Hypoallergenic Certified", "Free Returns", "Ships Worldwide"',
    ],
    steps: [
      'In Theme Customize, add an <strong>Image with Text</strong> or <strong>Custom Liquid</strong> block below the Add to Cart button in the product template',
      'Create a small icon bar with 4 trust badges (use SVG icons for crisp display)',
      'Alternatively, install a free trust badge app from the Shopify App Store',
    ],
    stepsLabel: 'How to Implement',
  },
  {
    id: 7, priority: 'medium', title: 'Fix Color Contrast for Accessibility', time: '~ 1 hour', owner: 'Theme Developer',
    whatsWrong: 'Several text colors fail <strong>WCAG AA</strong> accessibility standards. Gray text (<code>#696969</code>) on white backgrounds has a contrast ratio of only 4.0:1 — the minimum required is 4.5:1. This makes text hard to read for visually impaired users and may create legal risk under ADA compliance.',
    example: `/* BEFORE (fails WCAG AA) */
color: #696969;    /* ratio: 4.0:1 — FAILS */
color: #45705f;    /* ratio: ~4.2:1 — borderline */

/* AFTER (passes WCAG AA) */
color: #595959;    /* ratio: 5.3:1 — PASSES */
color: #3a5e50;    /* ratio: 5.1:1 — PASSES */`,
    exampleLabel: 'What to Change',
    steps: [
      'Go to <strong>Edit Code</strong> → open theme CSS files',
      'Search for <code>#696969</code> and replace with <code>#595959</code>',
      'Search for <code>#45705f</code> and replace with <code>#3a5e50</code>',
      'Test with WebAIM Contrast Checker',
    ],
  },
  {
    id: 8, priority: 'medium', title: 'Write Unique Meta Descriptions for All Pages', time: '~ 2-3 hours', owner: 'Content / Marketing',
    whatsWrong: 'Most collection pages and the About page have <strong>missing or generic meta descriptions</strong>. Google auto-generates snippets that are often less compelling, resulting in lower click-through rates from search results.',
    pagesNeeded: [
      '<strong>Homepage</strong> — review and optimize existing',
      '<strong>Each collection</strong> (Women\'s, Men\'s, Underwear, Bras, etc.)',
      '<strong>About Us</strong> page',
      '<strong>Top 10 best-selling products</strong> (at minimum)',
    ],
    example: `Women's Collection:
"Shop hypoallergenic women's clothing made from 100% organic cotton. Designed for sensitive skin and allergies. Free shipping on orders over $75."

Underwear Collection:
"Cottonique organic cotton underwear — latex-free, chemical-free, and dermatologist-tested. Relief for eczema, contact dermatitis, and skin allergies."`,
    exampleLabel: 'Examples (150-160 characters each)',
    steps: [
      'For collections: <strong>Shopify Admin</strong> → Products → Collections → select collection → scroll to <strong>"Search engine listing"</strong> → Edit',
      'For pages: <strong>Shopify Admin</strong> → Online Store → Pages → select page → scroll to <strong>"Search engine listing"</strong> → Edit',
    ],
    stepsLabel: 'Where to Add',
  },
  {
    id: 9, priority: 'medium', title: 'Add Descriptive Alt Text to All Images', time: '~ 2-4 hours', owner: 'Content / Marketing',
    whatsWrong: 'Product and hero images lack descriptive <code>alt</code> text. This hurts <strong>Google Image Search visibility</strong> (a free traffic source) and makes the site inaccessible to screen reader users.',
    example: `Pattern:
"Cottonique [Product Name] - [Key Feature] - [Color/Variant]"

Examples:
"Cottonique Women's Hypoallergenic Bralette - 100% Organic Cotton - Natural White"
"Cottonique Men's Crew Neck T-Shirt - Latex-Free Elastic - Melange Grey"
"Cottonique Organic Cotton Ankle Socks - Seamless Toe - 3-Pack Natural"`,
    exampleLabel: 'Alt Text Formula',
    steps: [
      '<strong>Product images:</strong> Shopify Admin → Products → select product → click on each image → "Add alt text"',
      '<strong>Hero/banner images:</strong> Theme Customize → select the image block → fill in the "Image alt text" field',
      'Start with best-selling products and homepage images first',
    ],
    stepsLabel: 'Where to Add',
  },
  {
    id: 10, priority: 'medium', title: 'Expand the About Us Page', time: '~ 3-4 hours', owner: 'Content / Marketing',
    whatsWrong: 'The About page has minimal content. For a niche brand serving people with <strong>allergies and sensitive skin</strong>, this is a huge missed opportunity. These customers do extensive research before buying — they want to deeply trust your brand.',
    sectionsToAdd: [
      '<strong>Founder Story</strong> — Why was Cottonique created? What personal experience drove it?',
      '<strong>Mission Statement</strong> — "We exist to..." (clear and emotional)',
      '<strong>Certifications</strong> — Oeko-Tex, GOTS, organic cotton certifications with badge images',
      '<strong>Manufacturing Process</strong> — How are the garments made? What makes them different?',
      '<strong>Conditions We Help</strong> — Eczema, contact dermatitis, MCS, latex allergy, etc.',
      '<strong>Testimonials</strong> — Real customer stories with before/after experiences',
      '<strong>Press & Medical Endorsements</strong> — Any doctor recommendations or media features',
    ],
    tips: [
      'Use high-quality photos of the team and manufacturing facility',
      'Include a video if possible (even a 60-second founder message)',
      'Link to certification verification pages',
      'Aim for 800-1200 words minimum',
    ],
  },
];

function TaskCard({ task, checked, onToggle, isOpen, onToggleOpen }) {
  return (
    <div className={`task-card${checked ? ' completed' : ''}${isOpen ? ' open' : ''}`}>
      <div className="task-header-row" onClick={onToggleOpen}>
        <div className="checkbox-wrap" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={checked} onChange={onToggle} />
          <div className="checkmark" />
        </div>
        <div className={`task-number ${task.priority}`}>{task.id}</div>
        <div className="task-info">
          <div className="task-title">{task.title}</div>
          <div className="task-meta">
            <span className={`badge ${task.priority}`}>{task.priority}</span>
            <span className="timeline-badge">{task.time}</span>
            <span className="owner-tag">{task.owner}</span>
          </div>
        </div>
        <div className="expand-icon">&#9660;</div>
      </div>
      <div className="task-details">
        <div className="task-details-inner">
          <div className="detail-section">
            <div className="detail-label">What's Wrong</div>
            <div className="detail-text" dangerouslySetInnerHTML={{ __html: task.whatsWrong }} />
          </div>

          {task.scriptsFound && (
            <div className="detail-section">
              <div className="detail-label">Scripts Found</div>
              <div className="detail-text">
                <ul>
                  {task.scriptsFound.map((s, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
                  ))}
                </ul>
              </div>
            </div>
          )}

          {task.whatToAdd && (
            <div className="detail-section">
              <div className="detail-label">What to Add (Below "Add to Cart" button)</div>
              <div className="detail-text">
                <ul>
                  {task.whatToAdd.map((s, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
                  ))}
                </ul>
              </div>
            </div>
          )}

          {task.pagesNeeded && (
            <div className="detail-section">
              <div className="detail-label">Pages That Need Meta Descriptions</div>
              <div className="detail-text">
                <ul>
                  {task.pagesNeeded.map((s, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
                  ))}
                </ul>
              </div>
            </div>
          )}

          {task.sectionsToAdd && (
            <div className="detail-section">
              <div className="detail-label">Sections to Add</div>
              <div className="detail-text">
                <ul>
                  {task.sectionsToAdd.map((s, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
                  ))}
                </ul>
              </div>
            </div>
          )}

          {task.example && (
            <div className="detail-section">
              <div className="detail-label">{task.exampleLabel || 'Example'}</div>
              <div className="example-box">{task.example}</div>
            </div>
          )}

          {task.steps && (
            <div className="detail-section">
              <div className="detail-label">{task.stepsLabel || 'Step-by-Step Instructions'}</div>
              <ol className="steps-list">
                {task.steps.map((s, i) => (
                  <li key={i}><span dangerouslySetInnerHTML={{ __html: s }} /></li>
                ))}
              </ol>
            </div>
          )}

          {task.expected && (
            <div className="detail-section">
              <div className="detail-label">Expected Result</div>
              <div className="detail-text">{task.expected}</div>
            </div>
          )}

          {task.tips && (
            <div className="detail-section">
              <div className="detail-label">Tips</div>
              <div className="detail-text">
                <ul>
                  {task.tips.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(() => new Array(TASKS.length).fill(false));
  const [openCards, setOpenCards] = useState(() => new Set());

  // Check for existing Supabase session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setAuthed(true);
          loadProgress();
        }
      } catch {
        // Supabase not configured — fall back to simple auth
      }
      setLoading(false);
    }
    // Also check sessionStorage for simple fallback
    if (sessionStorage.getItem('cq-auth') === '1') {
      setAuthed(true);
      setLoading(false);
      loadProgress();
      return;
    }
    checkSession();
  }, []);

  function loadProgress() {
    const saved = localStorage.getItem('cq-audit-progress');
    if (saved) {
      try {
        setChecked(JSON.parse(saved));
      } catch {}
    }
  }

  async function handleLogin() {
    // Try Supabase email/password auth first
    try {
      if (supabase.supabaseUrl) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: 'audit@essentiallayer.com',
          password: password,
        });
        if (!authError) {
          setAuthed(true);
          sessionStorage.setItem('cq-auth', '1');
          loadProgress();
          return;
        }
      }
    } catch {}

    // Fallback: simple password check
    if (password === 'cottonique2026') {
      setAuthed(true);
      sessionStorage.setItem('cq-auth', '1');
      loadProgress();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  }

  const handleToggle = useCallback((index) => {
    setChecked(prev => {
      const next = [...prev];
      next[index] = !next[index];
      localStorage.setItem('cq-audit-progress', JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleOpen = useCallback((id) => {
    setOpenCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const completedCount = checked.filter(Boolean).length;
  const total = TASKS.length;
  const pct = Math.round((completedCount / total) * 100);
  const remaining = total - completedCount;

  if (loading) return <div className="audit-page" />;

  if (!authed) {
    return (
      <div className="audit-page">
        <div className="pw-screen">
          <div className="pw-box">
            <div className="lock-icon">&#128274;</div>
            <h2>Cottonique Audit Dashboard</h2>
            <p>Enter the team password to view the audit action items.</p>
            <div className="pw-input-wrap">
              <input
                type="password"
                placeholder="Enter password..."
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={handleLogin}>Unlock</button>
            </div>
            <div className="pw-error">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-page">
      <div className="audit-dashboard">
        <div className="top-bar">
          <div className="brand">
            Cottonique Audit <span>Action Plan</span>
          </div>
          <div className="progress-summary">
            <span>{completedCount} of {total} completed</span>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="audit-container">
          <div className="audit-hero">
            <h1>Website Optimization Roadmap</h1>
            <p>10 high-impact improvements for cottonique.com, prioritized by urgency and effort. Check off each item as your team completes it.</p>
          </div>

          <div className="stats-row">
            <div className="stat-card urgent">
              <div className="stat-number">3</div>
              <div className="stat-label">Urgent</div>
            </div>
            <div className="stat-card high">
              <div className="stat-number">3</div>
              <div className="stat-label">High Priority</div>
            </div>
            <div className="stat-card medium">
              <div className="stat-number">4</div>
              <div className="stat-label">Medium</div>
            </div>
            <div className="stat-card total">
              <div className="stat-number">{remaining}</div>
              <div className="stat-label">Remaining</div>
            </div>
          </div>

          <div className="legend">
            <div className="legend-item"><div className="legend-dot urgent" /> Urgent — Do this week</div>
            <div className="legend-item"><div className="legend-dot high" /> High — Do within 2 weeks</div>
            <div className="legend-item"><div className="legend-dot medium" /> Medium — Do within 30 days</div>
          </div>

          {TASKS.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              checked={checked[i]}
              onToggle={() => handleToggle(i)}
              isOpen={openCards.has(task.id)}
              onToggleOpen={() => toggleOpen(task.id)}
            />
          ))}

          {/* Timeline Summary */}
          <div className="task-card timeline-summary">
            <div className="task-details" style={{ maxHeight: 'none' }}>
              <div className="task-details-inner" style={{ border: 'none', paddingTop: 24 }}>
                <div className="detail-section">
                  <div className="detail-label" style={{ fontSize: 14 }}>Recommended Timeline</div>
                  <div className="detail-text">
                    <ul>
                      <li><strong style={{ color: 'var(--urgent)' }}>Week 1 (Urgent):</strong> Tasks 1-3 — Enable cart drawer, add H1 tags, add OG meta tags. ~2 hours total.</li>
                      <li><strong style={{ color: 'var(--high)' }}>Week 2 (High):</strong> Tasks 4-6 — Product schema, script cleanup, trust badges. ~5-7 hours total.</li>
                      <li><strong style={{ color: 'var(--medium)' }}>Weeks 3-4 (Medium):</strong> Tasks 7-10 — Contrast fixes, meta descriptions, alt text, About page. ~8-12 hours total.</li>
                    </ul>
                    <br />
                    <strong>Total estimated effort: 15-20 hours across 4 weeks.</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-footer">
            Cottonique Website Audit — Essential Layer — Prepared March 2026<br />
            Progress is saved locally in your browser.
          </div>
        </div>
      </div>
    </div>
  );
}
