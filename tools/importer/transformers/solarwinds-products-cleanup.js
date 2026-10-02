/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SolarWinds product catalog cleanup (template "products",
 * https://www.solarwinds.com/products). No-op for every other template.
 *
 * Register AFTER solarwinds-cleanup.js and BEFORE solarwinds-sections.js.
 * solarwinds-cleanup.js already removes, for every template: style/script/noscript,
 * OneTrust (#onetrust-consent-sdk ...), img.builder-pixel-*, data:/blob: images,
 * header, #consolidatedNav, footer, link, iframe, next-route-announcer,
 * q-focus-sentinel, #pfContentTrackOverlay, the "#" skip link, #ot-sdk-btn-floating.
 * The products page has no promo bar above the header.
 *
 * Selectors verified against migration-work/cleaned.html and
 * tools/importer/bd-snapshots/www.solarwinds.com/products.html:
 *  - A/B test 53601: div.a-53601 (older catalog, hidden; cleaned.html line 958)
 *    and div.b-53601 (migrated design, line 3846). Both are in the DOM; A is removed
 *    by selector only (never by visibility), so nothing of A survives whichever
 *    variant the session was assigned.
 *  - Mobile-only "Filter" trigger: div[variant="button-trigger"]
 *    .builder-261085cd7e4342ff913bfba98a4e05bb (line 4842), rebuilt by cards-catalog.
 *  - Builder tracking pixel: img[src*="cdn.builder.io/api/v1/pixel"] (snapshot; the
 *    scraper localized the src, class builder-pixel-* is also matched).
 *  - Chevron icons: <img src="data:image/svg+xml..."> in card names, filter toggles,
 *    "Contact Sales" and the Filter button (31 in variant B, all decorative).
 *  - "Email Link to Trial": hidden mobile alternates of the trial CTA (44, variant A
 *    in the snapshot; also removed by text in case the live render has them in B).
 *  - Heading emphasis (restored after parsing, see below):
 *      logo band  .builder-99e0a8f56d434791acbda4389f172670 h2:
 *        <strong>Chosen</strong> by industry leaders
 *      CTA band   .builder-7d438429969a4e909b063752d6fafedd h2:
 *        You may still have questions. <strong><span>We definitely have answers.</span></strong>
 *
 * Hero section.builder-0cb29e57784e4b408972c257443edb2b (H1 + subtitle H2) is left
 * as default content. The catalog div.builder-f1c0d2ea4a47440a93da266a0183861f is
 * not touched beyond the removals above (cards-catalog parser handles it).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Headings whose bold part must survive the import. The importer's pre-processing
// strips bare <strong> from headings before transformers run, and the columns-logos /
// hero-banner parsers rebuild headings from textContent, so the emphasis is captured
// in beforeTransform (from the live DOM or, if already stripped, from payload.html)
// and re-applied in afterTransform to the parsed heading with the same text.
const EMPHASIS_HEADINGS = [
  '.builder-99e0a8f56d434791acbda4389f172670 h2', // logo band
  '.builder-7d438429969a4e909b063752d6fafedd h2', // contact CTA band
];

// beforeTransform -> afterTransform hand-off, per document.
const captured = new WeakMap();

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

// Heading -> [{ text, bold }] runs, or null if it has no bold part.
function emphasisRuns(heading) {
  if (!heading || !heading.querySelector('strong, b')) return null;
  const runs = [];
  heading.childNodes.forEach((n) => {
    const bold = n.nodeType === 1 && /^(STRONG|B)$/.test(n.tagName);
    const text = n.textContent.replace(/\s+/g, ' ');
    if (!text.trim()) {
      if (text && runs.length) runs.push({ text: ' ', bold: false });
      return;
    }
    if (bold) {
      if (/^\s/.test(text)) runs.push({ text: ' ', bold: false });
      runs.push({ text: text.trim(), bold: true });
      if (/\s$/.test(text)) runs.push({ text: ' ', bold: false });
    } else {
      runs.push({ text, bold: false });
    }
  });
  return runs;
}

function applyRuns(heading, runs, doc) {
  heading.textContent = '';
  runs.forEach(({ text, bold }) => {
    if (bold) {
      const strong = doc.createElement('strong');
      strong.textContent = text;
      heading.append(strong);
    } else {
      heading.append(text);
    }
  });
  heading.normalize();
  // collapse doubled / edge spaces left by the runs
  heading.childNodes.forEach((n) => {
    if (n.nodeType === 3) n.nodeValue = n.nodeValue.replace(/\s+/g, ' ');
  });
  if (heading.firstChild && heading.firstChild.nodeType === 3) {
    heading.firstChild.nodeValue = heading.firstChild.nodeValue.replace(/^\s+/, '');
  }
  if (heading.lastChild && heading.lastChild.nodeType === 3) {
    heading.lastChild.nodeValue = heading.lastChild.nodeValue.replace(/\s+$/, '');
  }
}

export default function transform(hookName, element, payload) {
  const templateName = payload && payload.template && payload.template.name;
  if (templateName !== 'products') return;

  const doc = element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    // 1. A/B test 53601: drop the whole variant A catalog, keep variant B.
    if (!element.querySelector('.b-53601')) {
      console.warn('[solarwinds-products-cleanup] variant .b-53601 not found; removing .a-53601 anyway');
    }
    WebImporter.DOMUtils.remove(element, ['.a-53601']);

    // 2. Capture heading emphasis before anything else rewrites the headings.
    let original = null;
    const runsList = [];
    EMPHASIS_HEADINGS.forEach((sel) => {
      let runs = emphasisRuns(element.querySelector(sel));
      if (!runs && payload.html) {
        if (!original) original = new DOMParser().parseFromString(payload.html, 'text/html');
        runs = emphasisRuns(original.querySelector(sel));
      }
      if (runs) runsList.push({ text: clean(runs.map((r) => r.text).join('')), runs });
    });
    captured.set(doc, runsList);

    // 3. Non-content markup (mostly covered by solarwinds-cleanup.js; repeated so this
    //    transformer is self-contained): Builder inline CSS, tracking pixels.
    WebImporter.DOMUtils.remove(element, [
      'style',
      'img[src*="cdn.builder.io/api/v1/pixel"]',
      'img[class*="builder-pixel-"]',
    ]);

    // 4. Mobile-only "Filter" trigger button (rebuilt by the cards-catalog block).
    WebImporter.DOMUtils.remove(element, [
      '[variant="button-trigger"]',
      '.builder-261085cd7e4342ff913bfba98a4e05bb',
    ]);

    // 5. Decorative chevron icons (data: SVGs; the importer may already have turned
    //    them into blob: URLs).
    WebImporter.DOMUtils.remove(element, ['img[src^="data:image/svg"]', 'img[src^="blob:"]']);

    // 6. Hidden "Email Link to Trial" alternates of the trial CTA.
    element.querySelectorAll('a, button').forEach((el) => {
      if (/^email link to trial$/i.test(clean(el.textContent))) el.remove();
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Re-apply heading emphasis to the parsed headings (block cells or default content).
    const runsList = captured.get(doc) || [];
    captured.delete(doc);
    if (!runsList.length) return;
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      if (h.querySelector('strong, b')) return;
      const match = runsList.find((r) => r.text === clean(h.textContent));
      if (match) applyRuns(h, match.runs, doc);
    });
  }
}
