/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-products. Base: cards. Source: https://www.solarwinds.com/pricing
 * Template: pricing. Generated: 2026-09-30.
 *
 * Instances are the product-row containers that follow each category heading (the
 * heading itself stays default content). Source structure (Builder.io, validated against
 * block-context/cards-products/source.html + instances/01-03.html):
 *   container > .builder-symbol (one per product) > … > section:
 *     div > img                             product icon (DA URL after solarwinds-pricing-cleanup)
 *     offer column:
 *       .builder-text > h3 > a[href]        product name + product page link
 *       .builder-text "SaaS"                optional tag
 *       .builder-text "Starts at $8"        optional price
 *       .builder-text note                  optional price note
 *       a "Get a Quote"                     optional quote link
 *       a "Start Trial" / "Download Trial"  trial CTA (responsive duplicates + "Email Link to Trial")
 *       .builder-text "Fully functional …"  trial note
 *       button "Quick View"                 modal trigger (no href)
 *     details column: .builder-text > p (intro) + .builder-text > ul (bullets)
 *   Builder class ids differ per product, so items are keyed on the product <h3>
 *   (its highest ancestor holding a single h3) — no <a>/<button> is iterated.
 *
 * Output (blocks/cards-products/cards-products.js), 4 columns per product row:
 *   icon | H3 link, [tag], [<strong>price</strong>], [notes], [quote link],
 *          P <strong><a>trial</a></strong> <em><a>Quick View</a></em>, trial note
 *        | P <strong>intro</strong> + UL | Deployment ("SaaS" / "Self-Hosted")
 *
 * Deployment: the source markup carries no deployment attribute/class (Builder renders
 * only the "All" tab panel), so it comes from an explicit name map (authoring-analysis.json:
 * SaaS = Observability SaaS, Service Desk, Incident Response, Dameware Remote Everywhere;
 * everything else Self-Hosted), with a "SaaS" tag / name fallback for unknown products.
 * Quick View has no href in the source; it links to the product page (h3 link), else
 * the "Get a Quote" link.
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const normalize = (s) => clean(s).replace(/[‘’ʼ]/g, "'").replace(/[®™]/g, '').toLowerCase();

const DEPLOYMENT = {
  'solarwinds observability saas': 'SaaS',
  'service desk': 'SaaS',
  'solarwinds incident response': 'SaaS',
  'dameware remote everywhere': 'SaaS',
  'solarwinds observability self-hosted': 'Self-Hosted',
  'storage resource monitor': 'Self-Hosted',
  'web help desk': 'Self-Hosted',
  'solarwinds sql sentry': 'Self-Hosted',
  'database performance analyzer': 'Self-Hosted',
};

// Text of a node, ignoring inline <style>/<script> content (Builder.io inlines styles).
function textOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || /^(STYLE|SCRIPT|NOSCRIPT)$/.test(node.tagName)) return '';
  let text = '';
  node.childNodes.forEach((child) => {
    const t = textOf(child);
    text += /^(P|DIV|LI|H[1-6]|BR)$/.test(child.tagName || '') ? ` ${t} ` : t;
  });
  return text;
}

// Inline segments of a node as [text, emphasized], ignoring <style>/<script> content.
// Only <em>/<i> emphasis is kept (the intro is already wrapped in <strong>).
function segmentsOf(node, em = false, out = []) {
  if (!node) return out;
  if (node.nodeType === 3) { out.push([node.textContent, em]); return out; }
  if (node.nodeType !== 1 || /^(STYLE|SCRIPT|NOSCRIPT)$/.test(node.tagName)) return out;
  const isEm = em || /^(EM|I)$/.test(node.tagName);
  node.childNodes.forEach((child) => {
    const block = /^(P|DIV|LI|H[1-6]|BR)$/.test(child.tagName || '');
    if (block) out.push([' ', isEm]);
    segmentsOf(child, isEm, out);
    if (block) out.push([' ', isEm]);
  });
  return out;
}

// Rich inline content of `el`: whitespace normalized like clean(), <em> preserved.
function richInline(document, el) {
  const segs = [];
  let prevSpace = true;
  segmentsOf(el).forEach(([raw, em]) => {
    let t = raw.replace(/ /g, ' ').replace(/\s+/g, ' ');
    if (prevSpace) t = t.replace(/^ /, '');
    if (!t) return;
    prevSpace = t.endsWith(' ');
    const last = segs[segs.length - 1];
    if (last && last[1] === em) last[0] += t; else segs.push([t, em]);
  });
  while (segs.length) {
    const last = segs[segs.length - 1];
    last[0] = last[0].replace(/ $/, '');
    if (last[0]) break;
    segs.pop();
  }
  return segs.map(([t, em]) => {
    if (!em) return document.createTextNode(t);
    const lead = t.match(/^ */)[0];
    const trail = t.trim() ? t.match(/ *$/)[0] : '';
    const nodes = [];
    if (lead) nodes.push(document.createTextNode(lead));
    if (t.trim()) nodes.push(wrapIn(document, 'em', document.createTextNode(t.trim())));
    if (trail) nodes.push(document.createTextNode(trail));
    return nodes;
  }).flat();
}

function para(document, ...children) {
  const p = document.createElement('p');
  p.append(...children);
  return p;
}

function link(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

function wrapIn(document, tag, child) {
  const el = document.createElement(tag);
  el.append(child);
  return el;
}

function cleanList(document, ul) {
  const list = document.createElement('ul');
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const text = clean(textOf(li));
    if (text) list.append(wrapIn(document, 'li', document.createTextNode(text)));
  });
  return list.children.length ? list : null;
}

// Items: for each h3, its highest ancestor below `root` that holds only that h3.
function findItems(root) {
  const items = [];
  root.querySelectorAll('h3').forEach((h3) => {
    let item = h3;
    while (item.parentElement && item.parentElement !== root
      && item.parentElement.querySelectorAll('h3').length === 1) item = item.parentElement;
    if (!items.includes(item)) items.push(item);
  });
  return items;
}

// Highest ancestor of `node` inside `item` that does not contain `h3`.
function columnOf(node, item, h3) {
  let col = node;
  while (col.parentElement && col.parentElement !== item && !col.parentElement.contains(h3)) {
    col = col.parentElement;
  }
  return col;
}

function findIcon(item, h3) {
  return [...item.querySelectorAll('img')].find((img) => !img.closest('a, button, h3')
    && !/builder-pixel/.test(img.className || '')
    // eslint-disable-next-line no-bitwise
    && (img.compareDocumentPosition(h3) & 4)); // icon precedes the name
}

// Offer column tokens in document order: text chunks, links and buttons.
function offerTokens(item, h3, skip) {
  const tokens = [];
  const walk = (node) => {
    [...node.children].forEach((el) => {
      if (el === h3) return;
      if (skip.some((s) => s === el) || /^(STYLE|SCRIPT|NOSCRIPT|IMG|SVG)$/i.test(el.tagName)) return;
      if (el.contains(h3)) { walk(el); return; }
      if (el.tagName === 'A' && el.getAttribute('href')) {
        tokens.push({ type: 'link', el, text: clean(textOf(el)) });
        return;
      }
      if (el.tagName === 'BUTTON') {
        tokens.push({ type: 'button', el, text: clean(textOf(el)) });
        return;
      }
      if (el.classList.contains('builder-text')) {
        const text = clean(textOf(el));
        if (text) tokens.push({ type: 'text', el, text });
        return;
      }
      walk(el);
    });
  };
  walk(item);
  return tokens;
}

function parseItem(document, item) {
  const h3 = item.querySelector('h3');
  const name = clean(textOf(h3));
  if (!name) return null;
  const nameLink = h3.querySelector('a[href]');
  const productHref = nameLink && nameLink.getAttribute('href');

  // details column: the one holding the bullet list
  const ul = item.querySelector('ul');
  const details = ul ? columnOf(ul, item, h3) : null;
  const icon = findIcon(item, h3);
  const iconCol = icon ? columnOf(icon, item, h3) : null;

  const tokens = offerTokens(item, h3, [details, iconCol].filter(Boolean));

  const heading = document.createElement('h3');
  heading.append(productHref ? link(document, productHref, name) : document.createTextNode(name));
  const offer = [heading];
  const post = [];
  let trial = null;
  let quickView = false;
  let quoteHref = null;
  const seen = new Set();
  let tag = '';
  let priced = false;

  tokens.forEach(({ type, el, text }) => {
    if (!text || seen.has(`${type}:${text}`)) return;
    if (type === 'link') {
      if (/email link/i.test(text)) return;
      if (/quick view/i.test(text)) { quickView = quickView || el.getAttribute('href'); return; }
      if (/trial|download|free/i.test(text)) {
        if (trial) return; // responsive duplicates of the trial CTA
        trial = { href: el.getAttribute('href'), text };
        seen.add(`${type}:${text}`);
        return;
      }
      seen.add(`${type}:${text}`);
      if (/quote/i.test(text)) quoteHref = quoteHref || el.getAttribute('href');
      offer.push(para(document, link(document, el.getAttribute('href'), text)));
      return;
    }
    if (type === 'button') {
      if (/quick view/i.test(text)) quickView = quickView || true;
      return;
    }
    seen.add(`${type}:${text}`);
    if (trial || quickView) { post.push(para(document, document.createTextNode(text))); return; }
    if (!priced && text.length <= 40 && /(^starts at|\$\s?\d)/i.test(text)) {
      priced = true;
      offer.push(para(document, wrapIn(document, 'strong', document.createTextNode(text))));
      return;
    }
    if (offer.length === 1 && /^(saas|self-hosted)$/i.test(text)) tag = text;
    offer.push(para(document, document.createTextNode(text)));
  });

  if (trial || quickView) {
    const cta = document.createElement('p');
    if (trial) cta.append(wrapIn(document, 'strong', link(document, trial.href, trial.text)));
    if (quickView) {
      const qvHref = typeof quickView === 'string' ? quickView : (productHref || quoteHref);
      if (qvHref) {
        if (trial) cta.append(document.createTextNode(' '));
        cta.append(wrapIn(document, 'em', link(document, qvHref, 'Quick View')));
      }
    }
    if (cta.childNodes.length) offer.push(cta);
  }
  offer.push(...post);

  // details: bold intro + bullets
  const detailCell = [];
  if (details) {
    const seenIntro = new Set();
    [...details.querySelectorAll('.builder-text, p')]
      .filter((el) => !el.querySelector('ul, ol, .builder-text, p') && !el.closest('ul, ol'))
      .forEach((el) => {
        const text = clean(textOf(el));
        if (!text || seenIntro.has(text)) return;
        seenIntro.add(text);
        const strong = document.createElement('strong');
        strong.append(...richInline(document, el));
        detailCell.push(para(document, strong));
      });
    const list = cleanList(document, ul);
    if (list) detailCell.push(list);
  }

  const key = normalize(name);
  let deployment = DEPLOYMENT[key];
  if (!deployment) {
    if (/^saas$/i.test(tag) || /\bsaas\b/i.test(name)) deployment = 'SaaS';
    else deployment = 'Self-Hosted';
  }

  return [icon || '', offer, detailCell.length ? detailCell : '', deployment];
}

export default function parse(element, { document }) {
  const cells = [];
  findItems(element).forEach((item) => {
    const row = parseItem(document, item);
    if (row) cells.push(row);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-products', cells });
  element.replaceWith(block);
}
