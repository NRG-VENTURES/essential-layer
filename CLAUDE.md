# CLAUDE.md — Essential Layer Website

## Project Overview

Static marketing website for **Essential Layer Inc.** and the **Cottonique** brand — a purpose-driven benefit corporation producing 100% organic certified garments. Dual operations in San Francisco, CA and Carmona, Cavite, Philippines.

## Tech Stack

- **HTML5** — Semantic markup with accessibility (ARIA labels, heading hierarchy)
- **CSS3** — Custom properties, Grid, Flexbox, animations, responsive breakpoints
- **Vanilla JavaScript** — Intersection Observer for scroll reveals, no frameworks
- **No build tools, no dependencies, no package.json**

## File Structure

```
essential-layer/
├── index.html        # Main website (hero, story, certifications, founders, contact)
├── privacy.html      # Privacy policy
├── terms.html        # Terms of service
├── styles.css        # All styling (CSS custom properties, responsive design)
├── script.js         # Minimal JS (scroll animations, dynamic year)
├── firebase.json     # Firebase Hosting config
├── vercel.json       # Vercel deployment config (clean URLs, no trailing slash)
└── README.md         # Project documentation
```

## Development

### Local Preview

```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

No install step, no build step. Files are served directly.

### Deployment

- **Firebase Hosting**: `firebase deploy` — serves from root, aggressive caching on JS/CSS
- **Vercel**: Auto-deploys with clean URLs (no `.html` extensions) and no trailing slashes

## Design System

### CSS Custom Properties

```css
--bg: #f3eee5          /* Warm cream background */
--accent: #0a8f68      /* Forest green (primary) */
--accent-strong: #076e52/* Darker green */
--highlight: #c68a2e   /* Gold/bronze accent */
--ink: #1b2a2a         /* Dark text */
--ink-soft: #425554    /* Softer gray text */
--surface: rgba(255, 255, 255, 0.72) /* Semi-transparent white */
```

### Fonts

- **Headings**: "Playfair Display" (serif)
- **Body**: "Outfit" (sans-serif)
- Loaded via Google Fonts with preconnect

### Responsive Breakpoints

- `860px` — Hide nav, adjust grids, footer goes 2-column
- `640px` — Single-column layouts, full-width buttons

## Conventions

### HTML

- Semantic elements: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`
- Proper heading hierarchy (h1 > h2 > h3)
- External links use `target="_blank" rel="noopener noreferrer"`
- Anchor navigation via hash links (#story, #certifications, etc.)

### CSS

- All styles in a single `styles.css` file
- Custom properties for theming at `:root`
- Organization: reset > layout > components > responsive
- No CSS frameworks or preprocessors
- Class-based styling (e.g., `.hero`, `.reveal`, `.legal-page`)

### JavaScript

- Progressive enhancement — site works without JS
- Feature detection with fallbacks (IntersectionObserver)
- No external dependencies
- Scroll reveal: elements with `.reveal` class get `.visible` added on viewport entry
- Respects `prefers-reduced-motion` media query

### Accessibility

- ARIA labels on navigation
- Focus-visible states on interactive elements
- Reduced motion support
- Semantic HTML throughout
- Adequate color contrast

## Git Workflow

- **Main branch**: `master`
- Feature branches with PR-based merges
- Branch naming: `claude/<description>-<id>`

## Key Content Sections (index.html)

1. **Header** — Sticky nav with wordmark
2. **Hero** — Value proposition + metrics cards
3. **Story** — "Why We Exist" narrative
4. **Certifications** — B Corp, GOTS, Benefit Corporation
5. **Operations** — Dual-country structure with stats
6. **Supply Chain** — Materials, manufacturing, labor, environmental transparency
7. **Founders** — Nikhiel, Vinesh, Shawn Genomal
8. **Impact** — Customer testimonials
9. **Contact** — US and Philippines offices
10. **Footer** — Navigation columns, copyright with dynamic year

## Important Notes

- Keep the zero-dependency philosophy — do not introduce build tools or npm packages
- Maintain the single-file approach (one CSS file, one JS file)
- All content changes should preserve the existing semantic structure and accessibility features
- Test responsiveness at both breakpoints (860px and 640px)
- External certification links must remain verifiable
