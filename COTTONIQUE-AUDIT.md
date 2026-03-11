# Cottonique.com Website Audit — 10 Lowest Hanging Fruits

**Audit Date:** March 11, 2026
**Website:** https://www.cottonique.com
**Platform:** Shopify (Fame theme v7.0.2)

---

## 1. Add Missing H1 Tags on Key Pages

**Issue:** The homepage and collection pages lack a proper `<h1>` heading tag. Search engines rely on H1 tags as the primary signal for what a page is about.

**Fix:** Add a single, keyword-rich H1 to every page. For the homepage, something like:
`<h1>Hypoallergenic Organic Cotton Clothing for Sensitive Skin</h1>`

**Impact:** High (SEO + Accessibility)
**Effort:** ~30 minutes in Shopify theme editor

---

## 2. Enable the Cart Drawer

**Issue:** The cart drawer is currently disabled (`"cartDrawerStatus": false`). This forces users to navigate to a separate cart page, adding friction to the purchase flow.

**Fix:** Enable the cart drawer in Theme Settings → Cart → Cart type → Drawer.

**Impact:** High (Conversion Rate)
**Effort:** ~5 minutes

---

## 3. Add Open Graph & Twitter Card Meta Tags

**Issue:** No Open Graph (`og:title`, `og:image`, `og:description`) or Twitter Card meta tags were detected. When someone shares a Cottonique link on social media, it will appear as a plain text link with no preview image or description.

**Fix:** Add OG and Twitter meta tags in `theme.liquid` or use a Shopify SEO app. Ensure every product and collection page has:
- `og:title`, `og:description`, `og:image`, `og:url`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

**Impact:** High (Social Traffic + Brand Perception)
**Effort:** ~1 hour

---

## 4. Add Product Schema (JSON-LD) to Product Pages

**Issue:** While basic Organization schema exists, individual product pages are missing rich Product schema markup (price, availability, reviews, SKU). This means Google cannot display rich snippets (star ratings, price, stock status) in search results.

**Fix:** Add JSON-LD Product schema to the product template. Shopify themes often have this partially built in — check if it just needs to be enabled. Include: `name`, `image`, `description`, `sku`, `offers` (price + availability), and `aggregateRating` from Judge.me reviews.

**Impact:** High (SEO — Click-Through Rate from Search)
**Effort:** ~2 hours

---

## 5. Optimize Page Load — Reduce Third-Party Script Bloat

**Issue:** The site loads 10+ third-party scripts (Judge.me, Klaviyo, Rebuy Engine, Globo Filters, Boost Sales/Avada, hCaptcha, tracking pixels). Rebuy appears to load **twice**. This slows down Time to Interactive and hurts both UX and Google Core Web Vitals.

**Fix:**
- Remove the duplicate Rebuy script
- Audit which apps are actually driving revenue — remove or defer the rest
- Lazy-load non-critical scripts (reviews, upsell widgets) so they load after the main content

**Impact:** High (Page Speed + SEO + UX)
**Effort:** ~2-3 hours

---

## 6. Add Trust Badges Above the Fold

**Issue:** While the site has Judge.me reviews and Shopify Payments, there are no visible trust/security badges (SSL lock, payment method icons, "100% Organic Cotton" badge, allergy-safe certification) displayed prominently above the fold on product pages.

**Fix:** Add a small trust badge bar near the "Add to Cart" button showing:
- Accepted payment methods (Visa, MC, Amex, Discover)
- A security/SSL badge
- Key differentiators ("100% Organic Cotton", "Hypoallergenic Certified", "Free Returns")

**Impact:** Medium-High (Conversion Rate)
**Effort:** ~1-2 hours

---

## 7. Fix Color Contrast for Accessibility (WCAG AA)

**Issue:** Several text/background color combinations likely fail WCAG AA contrast requirements:
- `#696969` (gray text) on white backgrounds (ratio ~4.0:1, needs 4.5:1)
- `#45705f` (teal/green) used in form inputs may also be borderline
- Small text at low contrast is especially problematic on mobile

**Fix:** Darken text colors to meet the 4.5:1 minimum ratio. For example, change `#696969` → `#595959` or darker. Use a contrast checker tool to verify.

**Impact:** Medium (Accessibility + Legal Compliance + UX)
**Effort:** ~1 hour in theme CSS

---

## 8. Write Unique Meta Descriptions for All Pages

**Issue:** Collection pages and the About Us page appear to have missing or generic meta descriptions. Google will auto-generate snippets, which are often less compelling than a crafted description.

**Fix:** Write unique, keyword-optimized meta descriptions (150-160 characters) for:
- Homepage ✓ (has one, but review for optimization)
- Each collection page (e.g., "Shop hypoallergenic women's underwear made from 100% organic cotton...")
- About Us page
- Key product pages (at minimum, best sellers)

**Impact:** Medium (SEO — Click-Through Rate)
**Effort:** ~2-3 hours for all pages

---

## 9. Add Image Alt Text Across the Site

**Issue:** Product images and hero/banner images appear to lack descriptive alt text. This hurts both SEO (Google Image Search) and accessibility (screen readers).

**Fix:** Add descriptive, keyword-relevant alt text to all images. For products, use the pattern:
`"Cottonique [Product Name] - [Key Feature] - [Color/Variant]"`
Example: `"Cottonique Women's Hypoallergenic Bralette - 100% Organic Cotton - Natural White"`

**Impact:** Medium (SEO + Accessibility)
**Effort:** ~2-4 hours depending on catalog size

---

## 10. Improve the About Us Page Content

**Issue:** The About Us page appears to have minimal substantive content. For a niche brand like Cottonique that serves people with allergies and sensitive skin, this is a missed opportunity. Customers buying hypoallergenic products want to trust the brand deeply.

**Fix:** Expand the About Us page with:
- Founder story and mission (why Cottonique exists)
- Certifications and testing methodology (Oeko-Tex, organic certifications)
- The specific allergies and skin conditions the products address
- Manufacturing process and quality standards
- Customer testimonials / before-after stories
- Press mentions or medical professional endorsements

**Impact:** Medium (Trust + Conversion + SEO for brand queries)
**Effort:** ~3-4 hours for content writing

---

## Priority Matrix

| # | Fix | Impact | Effort | Do First? |
|---|-----|--------|--------|-----------|
| 1 | H1 Tags | High | 30 min | ✅ |
| 2 | Cart Drawer | High | 5 min | ✅ |
| 3 | OG/Twitter Meta | High | 1 hr | ✅ |
| 4 | Product Schema | High | 2 hr | ✅ |
| 5 | Script Bloat | High | 2-3 hr | ✅ |
| 6 | Trust Badges | Med-High | 1-2 hr | ✅ |
| 7 | Color Contrast | Medium | 1 hr | ✅ |
| 8 | Meta Descriptions | Medium | 2-3 hr | ✅ |
| 9 | Image Alt Text | Medium | 2-4 hr | ✅ |
| 10 | About Us Content | Medium | 3-4 hr | ✅ |

**Estimated total effort: ~15-20 hours to address all 10 items.**

Items 1-3 can be done in under 2 hours combined and will have the biggest immediate impact.
