/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SolarWinds blog landing page cleanup (template "blog").
 * No-op for every other template.
 *
 * Runs after solarwinds-cleanup.js, which already removes for every template:
 * style/script/noscript, OneTrust (#onetrust-consent-sdk ...), data:/blob: icon
 * images (all blog data: images are decorative arrows in links), header, footer,
 * link, iframe, #ot-sdk-btn-floating, [id^="batBeacon"].
 *
 * Selectors verified against migration-work/cleaned.html and
 * tools/importer/bd-snapshots/www.solarwinds.com/blog.html:
 *  - div.orangematter-header: wraps the blog header (header#head) + div.om-nav-overlay
 *  - div.main-content: all page content (7 sections) + trailing empty <p>
 *  - body-level leftovers after the footer: wistia-tag-manager, wistia styles, iframes,
 *    OneTrust, batBeacon (everything outside div.main-content)
 *  - .latest-posts-section > .latest-post (div.number + div > a + div.date), .view-all > a
 *  - .sw25-om-category-spotlight .block-head > div.subheadline, h2.headline, a.om10-cta
 *  - .sw25-om-featured-voices .headline (div > p "Featured Voices")
 *  - .sw25-om-featured-categories h2.headline > span.desktop + span.mobile (duplicate text)
 *  - analytics attributes: data-linktype, data-linkdetail, analyticsinitialized
 *
 * Default-content conversions run in afterTransform so block parsers see the original
 * DOM (e.g. cards-posts uses ".block-head + .block-article"); section wrappers are
 * never replaced, so the solarwinds-sections.js markers stay valid.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const ANALYTICS_ATTRS = ['data-linktype', 'data-linkdetail', 'analyticsinitialized'];

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export default function transform(hookName, element, payload) {
  const templateName = payload && payload.template && payload.template.name;
  if (templateName !== 'blog') return;

  const doc = element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    // Blog header / sub-navigation wrapper (header#head + nav overlay).
    WebImporter.DOMUtils.remove(element, ['.orangematter-header']);
  }

  if (hookName === TransformHook.afterTransform) {
    const main = element.querySelector('.main-content');

    // Everything outside div.main-content is chrome / third-party (footer, OneTrust,
    // wistia-tag-manager, pixels, iframes).
    if (main && main.parentElement === element) {
      [...element.children].forEach((child) => {
        if (child !== main) child.remove();
      });
    }
    WebImporter.DOMUtils.remove(element, ['wistia-tag-manager']);

    const root = main || element;

    // Trailing empty <p> after the last section (authoring-analysis "rc9").
    root.querySelectorAll(':scope > p').forEach((p) => {
      if (!clean(p.textContent) && !p.querySelector('img, picture, a')) p.remove();
    });

    // Section 1: Latest Posts -> numbered list of linked titles with date, + link paragraph.
    root.querySelectorAll('.latest-posts-section').forEach((section) => {
      const posts = [...section.querySelectorAll(':scope > .latest-post')];
      if (posts.length) {
        const ol = doc.createElement('ol');
        posts.forEach((post) => {
          const link = post.querySelector('a');
          if (!link) return;
          const li = doc.createElement('li');
          const a = doc.createElement('a');
          a.href = link.getAttribute('href');
          a.textContent = clean(link.textContent);
          li.append(a);
          const date = clean(post.querySelector('.date') && post.querySelector('.date').textContent);
          if (date) li.append(doc.createElement('br'), date);
          ol.append(li);
        });
        posts[0].before(ol);
        posts.forEach((post) => post.remove());
      }
      section.querySelectorAll(':scope > .view-all').forEach((viewAll) => {
        const link = viewAll.querySelector('a');
        if (!link) { viewAll.remove(); return; }
        const p = doc.createElement('p');
        const a = doc.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = clean(link.textContent);
        p.append(a);
        viewAll.replaceWith(p);
      });
    });

    // Section 3: Spotlight eyebrow + "View All" link -> paragraphs (H2 kept).
    root.querySelectorAll('.sw25-om-category-spotlight .block-head').forEach((head) => {
      head.querySelectorAll(':scope > .subheadline').forEach((eyebrow) => {
        const p = doc.createElement('p');
        p.textContent = clean(eyebrow.textContent);
        eyebrow.replaceWith(p);
      });
      head.querySelectorAll(':scope > h2').forEach((h2) => { h2.textContent = clean(h2.textContent); });
      head.querySelectorAll(':scope > a').forEach((link) => {
        const p = doc.createElement('p');
        const a = doc.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = clean(link.textContent);
        p.append(a);
        link.replaceWith(p);
      });
    });

    // Section 4: "Featured Voices" is a div > p on the source -> H2.
    root.querySelectorAll('.sw25-om-featured-voices .headline').forEach((headline) => {
      if (headline.tagName === 'H2') return;
      const h2 = doc.createElement('h2');
      h2.textContent = clean(headline.textContent);
      headline.replaceWith(h2);
    });

    // Section 5: h2.headline repeats its text in span.desktop + span.mobile -> single text.
    root.querySelectorAll('.sw25-om-featured-categories h2.headline').forEach((h2) => {
      const desktop = h2.querySelector('span.desktop');
      h2.textContent = clean(desktop ? desktop.textContent : h2.textContent);
    });

    // Analytics attributes (noise).
    root.querySelectorAll(ANALYTICS_ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
      ANALYTICS_ATTRS.forEach((a) => el.removeAttribute(a));
    });
  }
}
