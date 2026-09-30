/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SolarWinds site-wide cleanup (Builder.io source).
 *
 * All selectors verified against migration-work/cleaned.html unless noted.
 *
 * A/B test: Builder.io renders both variants in the DOM.
 *   - Variant A wrappers: div.builder-block.a-53874 (kept, migrated)
 *   - Variant B wrappers: div.builder-block.b-53874 (removed)
 * The inactive variant is hidden with CSS and on the live page variant A may be
 * the hidden one, so this transformer NEVER removes anything based on
 * visibility / computed display. Only explicit selectors are used.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Variant B of the Builder.io A/B test (cleaned.html lines 1075, 2268).
    // Must run before parsing so parsers only ever see variant A content.
    WebImporter.DOMUtils.remove(element, ['.b-53874']);

    // Non-content markup. style/script/noscript/JSON-LD are stripped from
    // cleaned.html by the scraper but are present on the live page.
    WebImporter.DOMUtils.remove(element, [
      'style',
      'script',
      'noscript',
      'script[type="application/ld+json"]',
    ]);

    // OneTrust cookie banner (injected at runtime on the live page; not present
    // in the scraped cleaned.html). Standard OneTrust SDK container ids.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
    ]);

    // Builder.io tracking pixels: img.builder-pixel-<id> (5 in cleaned.html).
    WebImporter.DOMUtils.remove(element, ['img[class*="builder-pixel-"]']);

    // Decorative inline SVGs (line graphics, arrow/quote icons) are embedded as
    // data: URIs, which the importer turns into unresolvable blob: URLs. All
    // content images on this page are served from p1.aprimocdn.net.
    WebImporter.DOMUtils.remove(element, ['img[src^="data:"]', 'img[src^="blob:"]']);

    // Section 9: duplicate "View All Resources" link. Keep
    // .builder-2adb95ecd59f402b912f4cdc1834fe76, drop this one (line 2252).
    WebImporter.DOMUtils.remove(element, ['.builder-12b34301a8a949aba5df8f6fb81018a5']);

    // The kept "View All Resources" link is an outlined button on the source;
    // wrap it in <em> so EDS decorates it as a secondary button.
    element.querySelectorAll('a.builder-2adb95ecd59f402b912f4cdc1834fe76').forEach((a) => {
      if (a.closest('em')) return;
      const em = element.ownerDocument.createElement('em');
      a.replaceWith(em);
      em.append(a);
    });

    // Section 5: hidden eyebrow "Your service desk sidekick" (line 1691),
    // hidden in source per authoring-analysis.json.
    WebImporter.DOMUtils.remove(element, ['.builder-427aab20932e4a09951b2ffa6454341f']);

    // Section 6 heading: the bold second line is a styled <span> next to an
    // empty <strong>; turn it into real bold text so it survives the import.
    element.querySelectorAll('.builder-e90ffb7b51c043bc8082f3451ab6d682 h2').forEach((h2) => {
      h2.querySelectorAll('strong').forEach((s) => { if (!s.textContent.trim()) s.replaceWith(' '); });
      h2.querySelectorAll('span').forEach((span) => {
        const strong = element.ownerDocument.createElement('strong');
        strong.textContent = span.textContent.trim();
        span.replaceWith(strong);
      });
    });

    // The importer's pre-processing strips bare <strong> tags from headings before
    // transformers run (e.g. "Solve your biggest challenges. <strong>Faster.</strong>").
    // Restore the emphasis from the original page HTML, matching headings by the
    // Builder.io id class of their nearest builder ancestor.
    if (payload && payload.html) {
      const original = new DOMParser().parseFromString(payload.html, 'text/html');
      element.querySelectorAll('h1, h2, h3').forEach((h) => {
        if (h.querySelector('strong, b')) return;
        let id = null;
        for (let a = h.parentElement; a && !id; a = a.parentElement) {
          id = [...a.classList].find((c) => /^builder-[0-9a-f]{32}$/.test(c));
        }
        if (!id) return;
        const origHeading = [...original.querySelectorAll(`.${id} ${h.tagName}`)]
          .find((o) => o.textContent.replace(/\s+/g, ' ').trim() === h.textContent.replace(/\s+/g, ' ').trim());
        if (!origHeading || !origHeading.querySelector('strong, b')) return;
        h.textContent = '';
        origHeading.childNodes.forEach((n) => {
          if (n.nodeType === 1 && /^(STRONG|B)$/.test(n.tagName)) {
            if (!n.textContent.trim()) return;
            const strong = element.ownerDocument.createElement('strong');
            strong.textContent = n.textContent.trim();
            h.append(' ', strong, ' ');
          } else {
            h.append(n.textContent);
          }
        });
        h.normalize();
        h.innerHTML = h.innerHTML.replace(/\s+/g, ' ').trim();
      });
    }

    // Section 5: "View All Solutions" button, display:none on the source.
    WebImporter.DOMUtils.remove(element, ['.builder-a0a0d962ca584574b3876b67f81f6ff9']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome, already migrated separately:
    //  - "SolarWinds Day" promo bar above the header: div.right-0.left-0.z-30 (line 17)
    //  - desktop + mobile headers: header (lines 89, 921), incl. #consolidatedNav
    //  - main footer + legal footer: footer (lines 3323, 3502)
    WebImporter.DOMUtils.remove(element, [
      'div.right-0.left-0.z-30',
      'header',
      '#consolidatedNav',
      'footer',
    ]);

    // Leftover non-authorable elements at the end of <body> (lines 3532-3549)
    // and the empty skip link at the top of <body> (line 2).
    WebImporter.DOMUtils.remove(element, [
      'link',
      'iframe',
      'next-route-announcer',
      'q-focus-sentinel',
      '#pfContentTrackOverlay',
      ':scope > a[href="#"]',
    ]);
  }
}
