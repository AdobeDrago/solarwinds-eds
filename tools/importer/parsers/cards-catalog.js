/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-catalog. Base: cards (custom). Source: https://www.solarwinds.com/products
 * Instance: div.builder-f1c0d2ea4a47440a93da266a0183861f (A/B variant B; variant A is removed
 * by solarwinds-products-cleanup.js before parsing).
 *
 * Output (matches blocks/cards-catalog/README.md + cards-catalog.js):
 *   row (1 cell, optional): sidebar note — <p><strong>Not sure where to start?</strong></p>,
 *     paragraph, <p><a>Contact Sales</a></p>
 *   per category (source order): row (1 cell) holding only an <h2>
 *   per product: row (3 cells)
 *     1. card: <h3><a>name</a></h3>, <p><em>tagline</em></p>, <p>description</p>,
 *        <p><strong><a>Start Trial</a></strong></p>, <p>trial note</p>
 *     2. product type ("SaaS" / "Self-Hosted", comma-separated)
 *     3. overview: icon <img>, <h3><a>modal title</a></h3>, <p>description</p>, <p><strong><a>cta</a></strong></p>,
 *        <p><em><a>Learn More</a></em></p>, media (<p><a>wistia url</a></p> or <p><img></p>),
 *        highlights as <h4> + <p>
 *
 * Card fields come from the page DOM (fallback: data file). Product type and overview come
 * from tools/importer/data/products-overviews.json (overview modals are rendered on click and
 * are not in the HTML), matched by name, then by href path. Missing fields are omitted.
 *
 * Selectors verified against migration-work/block-context/cards-catalog/source.html:
 *   categories: h2 inside section (h2 -> div.border-headline -> section.flex.flex-col)
 *   products:   article (27, iteration key — block-level, not an inline wrapper)
 *   name/href:  article h3 a; tagline: h3's sibling div; description: article p
 *   trial:      a[data-automation-id="cta-button"] (variant="primary") + sibling span (note)
 *   note:       .builder-50f1417a0ca84731ae1b08072eb7ccad (fallback: Contact Sales link parent)
 */
import overviews from '../data/products-overviews.json';

const ORIGIN = 'https://www.solarwinds.com';

const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function absolute(href) {
  if (!href) return null;
  try {
    return new URL(href, ORIGIN).href;
  } catch (e) {
    return href;
  }
}

function pathKey(href) {
  try {
    return new URL(href, ORIGIN).pathname.replace(/\/+$/, '').toLowerCase();
  } catch (e) {
    return null;
  }
}

const PRODUCTS = (overviews && overviews.products) || [];

function findData(name, href) {
  const n = clean(name).toLowerCase();
  let match = n && PRODUCTS.find((p) => clean(p.name).toLowerCase() === n);
  const key = href && pathKey(href);
  if (!match && key) match = PRODUCTS.find((p) => pathKey(p.href) === key);
  return match || null;
}

export default function parse(element, { document }) {
  const el = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };
  const link = (href, text) => {
    const a = el('a', text);
    a.href = absolute(href);
    return a;
  };
  const wrapped = (wrapperTags, child) => {
    // e.g. wrapped(['p', 'strong'], a) -> <p><strong><a/></strong></p>
    const outer = el(wrapperTags[0]);
    let cur = outer;
    wrapperTags.slice(1).forEach((t) => {
      const n = el(t);
      cur.append(n);
      cur = n;
    });
    cur.append(child);
    return outer;
  };

  const cells = [];

  /* sidebar note (optional first row) */
  let noteRoot = element.querySelector('.builder-50f1417a0ca84731ae1b08072eb7ccad');
  const contactLink = [...element.querySelectorAll('a[href]')]
    .find((a) => /^contact sales$/i.test(clean(a.textContent)));
  if (!noteRoot && contactLink) noteRoot = contactLink.parentElement;
  if (noteRoot) {
    const note = [];
    const texts = [...noteRoot.querySelectorAll('p')].map((p) => clean(p.textContent)).filter(Boolean);
    texts.forEach((text, i) => {
      if (i === 0) note.push(wrapped(['p', 'strong'], document.createTextNode(text)));
      else note.push(el('p', text));
    });
    const cta = (contactLink && noteRoot.contains(contactLink)) ? contactLink
      : noteRoot.querySelector('a[href]');
    if (cta && clean(cta.textContent)) {
      note.push(wrapped(['p'], link(cta.getAttribute('href'), clean(cta.textContent))));
    }
    if (note.length) cells.push([note]);
  }

  /* categories and products, in source order */
  const headings = [...element.querySelectorAll('h2')].filter((h) => clean(h.textContent));
  let productCount = 0;
  headings.forEach((h2) => {
    const section = h2.closest('section');
    if (!section || !element.contains(section)) return;
    const articles = [...section.querySelectorAll('article')];
    if (!articles.length) return;

    cells.push([[el('h2', clean(h2.textContent))]]);

    articles.forEach((article) => {
      const h3 = article.querySelector('h3, h4, [class*="title"]');
      const nameLink = h3 && h3.querySelector('a[href]');
      const name = clean(h3 && h3.textContent);
      const href = nameLink ? nameLink.getAttribute('href') : null;
      const data = findData(name, href);

      /* cell 1: card */
      const card = [];
      const productName = name || (data && data.name);
      if (productName) {
        const heading = el('h3');
        const productHref = href || (data && data.href);
        if (productHref) heading.append(link(productHref, productName));
        else heading.textContent = productName;
        card.push(heading);
      }

      const taglineEl = h3 && h3.parentElement
        ? [...h3.parentElement.children].find((c) => c !== h3 && clean(c.textContent))
        : null;
      const tagline = clean(taglineEl && taglineEl.textContent) || (data && data.tagline);
      if (tagline) card.push(wrapped(['p', 'em'], document.createTextNode(tagline)));

      const descEl = [...article.querySelectorAll('p')].find((p) => clean(p.textContent));
      const description = clean(descEl && descEl.textContent) || (data && data.description);
      if (description) card.push(el('p', description));

      const trial = article.querySelector('a[data-automation-id="cta-button"]')
        || article.querySelector('a[variant="primary"]');
      const trialLabel = clean(trial && trial.textContent) || (data && data.trialLabel);
      const trialHref = (trial && trial.getAttribute('href')) || (data && data.trialHref);
      if (trialLabel && trialHref) card.push(wrapped(['p', 'strong'], link(trialHref, trialLabel)));

      const noteEl = trial && trial.parentElement
        ? [...trial.parentElement.children].find((c) => c !== trial && c.tagName !== 'A' && clean(c.textContent))
        : null;
      const trialNote = clean(noteEl && noteEl.textContent) || (data && data.trialNote);
      if (trialNote) card.push(el('p', trialNote));

      /* cell 2: product type */
      const types = data && Array.isArray(data.productType) ? data.productType.filter(Boolean) : [];
      const typeCell = types.length ? types.join(', ') : '';

      /* cell 3: overview */
      const overview = [];
      const o = data && data.overview;
      if (o) {
        if (o.icon) {
          const img = el('img');
          img.src = o.icon;
          img.alt = '';
          overview.push(wrapped(['p'], img));
        }
        // modal title: H3 (as on the source modal), linked to the product page. It can
        // differ from the card name (e.g. "Serv-U File Transfer Protocol Server").
        const title = clean(o.title) || productName;
        if (title) {
          const h = el('h3');
          const titleHref = o.titleHref || (data && data.href);
          if (titleHref) h.append(link(titleHref, title));
          else h.textContent = title;
          overview.push(h);
        }
        if (o.description) overview.push(el('p', clean(o.description)));
        if (o.ctaHref && o.ctaLabel) overview.push(wrapped(['p', 'strong'], link(o.ctaHref, clean(o.ctaLabel))));
        if (o.learnMoreHref) overview.push(wrapped(['p', 'em'], link(o.learnMoreHref, 'Learn More')));
        const media = o.media;
        if (media && media.type === 'wistia' && media.id) {
          const url = `https://fast.wistia.com/embed/medias/${media.id}`;
          overview.push(wrapped(['p'], link(url, url)));
        } else if (media && media.type === 'image' && media.src) {
          const img = el('img');
          img.src = media.src;
          img.alt = clean(media.alt) || '';
          overview.push(wrapped(['p'], img));
        }
        (o.features || []).forEach((f) => {
          if (f && clean(f.title)) overview.push(el('h4', clean(f.title)));
          if (f && clean(f.text)) overview.push(el('p', clean(f.text)));
        });
      }

      if (!card.length) return;
      cells.push([card, typeCell, overview.length ? overview : '']);
      productCount += 1;
    });
  });

  if (!productCount) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-catalog', cells });
  element.replaceWith(block);
}
