# CLAUDE.md — Essential Layer Website

## Project Overview

Essential Layer is a static informational website for a purpose-driven organic garment company (brand: **Cottonique**). The site covers company mission, certifications, supply chain transparency, founders, and contact info.

**Tech stack:** Vanilla HTML5, CSS3, JavaScript (ES6). Zero dependencies, no build step.

## File Structure

```
index.html      — Main website (single-page with anchor sections)
privacy.html    — Privacy policy
terms.html      — Terms of service
styles.css      — All styles (CSS custom properties, responsive)
script.js       — Scroll animations (IntersectionObserver) + footer year
vercel.json     — Vercel deployment config (clean URLs)
firebase.json   — Firebase Hosting config (caching headers)
README.md       — Project docs and deployment guides
```

## Local Development

```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

No npm, no build tools, no compilation required.

## Deployment

- **Vercel:** Push to deploy. Config in `vercel.json` (clean URLs, no trailing slash).
- **Firebase:** `firebase deploy --only hosting`. Config in `firebase.json` (1-year cache for CSS/JS).

## Design System

CSS custom properties defined at `:root` in `styles.css`:

| Variable      | Value     | Purpose              |
|---------------|-----------|----------------------|
| `--bg`        | `#f3eee5` | Background (warm beige) |
| `--accent`    | `#0a8f68` | Primary action (teal green) |
| `--highlight`  | `#c68a2e` | Accent highlight (gold) |
| `--ink`       | `#1b2a2a` | Text color (dark)    |
| `--max`       | `1120px`  | Max content width    |
| `--radius`    | `20px`    | Border radius        |

Responsive breakpoints: `860px` and `640px`.

## Code Conventions

- **HTML:** Semantic sections with IDs for anchor nav (`#story`, `#certifications`, `#transparency`, `#founders`, `#contact`, `#impact`)
- **CSS:** BEM-style class names (`.hero`, `.section`, `.card`, `.founder-card`, `.testimonial-card`). Mobile-first responsive.
- **JS:** Vanilla ES6 only. Uses `IntersectionObserver` for `.reveal` scroll animations. Respects `prefers-reduced-motion`.
- **Fonts:** Google Fonts CDN — Outfit (body) and Playfair Display (headings).

## Key Rules for AI Assistants

- This is a **static site** — no frameworks, no bundlers, no package manager. Keep it that way.
- All styles go in `styles.css`. All scripts go in `script.js`. Do not add new files unless absolutely necessary.
- Maintain the existing CSS custom property system for colors/spacing.
- Preserve accessibility: semantic HTML, aria labels, reduced-motion support.
- Test changes with a local server (`python3 -m http.server 8000`).
- No external JS/CSS libraries unless explicitly requested.

## Git Conventions

- Branch naming: `claude/<description>-<id>` for AI-generated branches
- Commit messages: Descriptive, feature-based (e.g., "Add trust and transparency improvements to website")
- Remote: `origin` on GitHub under `NRG-VENTURES/essential-layer`
- Primary branch: `master`
