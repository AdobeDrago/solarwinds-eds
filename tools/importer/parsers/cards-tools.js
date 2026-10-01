/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-tools. Base: cards. Source: https://www.solarwinds.com/pricing
 * Template: pricing. Generated: 2026-09-30.
 *
 * Instances are the tool-grid containers after the "SolarWinds SaaS Tools" and
 * "SolarWinds Self-Hosted Tools" headings (headings stay default content).
 * Source structure (Builder.io, validated against block-context/cards-tools/source.html
 * + instances/01.html):
 *   container > … > .builder-symbol (one per tool) > … card:
 *     div > img                               tool icon (DA URL after solarwinds-pricing-cleanup)
 *     h3 > div > a[href] > .builder-text      tool name + tool page link
 *     .builder-text "Starts at $972" / "Only $999"   price
 *     .builder-text note                      optional ("No monthly fees", …)
 *     a "Get a Quote"                         optional quote link
 *     a "Start Trial" / "Download Trial" + .builder-text trial note
 *       (followed by responsive duplicates: a second trial link or "Email Link To Trial"
 *        with the same note — dropped)
 *     button "Quick View"                     modal trigger (no href)
 *   Builder class ids differ per tool, so items are keyed on the tool <h3> (its highest
 *   ancestor holding a single h3) — no <a>/<button> is iterated.
 *
 * Output (blocks/cards-tools/cards-tools.js), 3 columns per tool row:
 *   icon | H3 link, <strong>price</strong>, [notes], [quote link],
 *          P <strong><a>trial</a></strong> <em><a>Quick View</a></em>, trial note
 *        | Deployment ("SaaS" / "Self-Hosted")
 *
 * Deployment: no deployment attribute/class in the source markup, so it comes from an
 * explicit name map (authoring-analysis.json: Dameware Remote Everywhere = SaaS, all
 * other tools incl. Kiwi Log Viewer = Self-Hosted), with a "SaaS" name fallback.
 * Quick View has no href in the source; it links to the tool page (h3 link), else
 * the "Get a Quote" link.
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const normalize = (s) => clean(s).replace(/[‘’ʼ]/g, "'").replace(/[®™]/g, '').toLowerCase();

const DEPLOYMENT = {
  'dameware remote everywhere': 'SaaS',
  'dameware mini remote control': 'Self-Hosted',
  'dameware remote support': 'Self-Hosted',
  "engineer's toolset": 'Self-Hosted',
  'kiwi cattools': 'Self-Hosted',
  'kiwi syslog server': 'Self-Hosted',
  'kiwi log viewer': 'Self-Hosted',
  'network topology mapper': 'Self-Hosted',
  'serv-u file transfer protocol server': 'Self-Hosted',
  'serv-u managed file transfer server': 'Self-Hosted',
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

// Offer tokens in document order: text chunks, links and buttons.
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
  const toolHref = nameLink && nameLink.getAttribute('href');

  const icon = findIcon(item, h3);
  const iconCol = icon ? columnOf(icon, item, h3) : null;
  const tokens = offerTokens(item, h3, [iconCol].filter(Boolean));

  const heading = document.createElement('h3');
  heading.append(toolHref ? link(document, toolHref, name) : document.createTextNode(name));
  const offer = [heading];
  const post = [];
  let trial = null;
  let quickView = false;
  let quoteHref = null;
  let priced = false;
  const seen = new Set();

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
    offer.push(para(document, document.createTextNode(text)));
  });

  if (trial || quickView) {
    const cta = document.createElement('p');
    if (trial) cta.append(wrapIn(document, 'strong', link(document, trial.href, trial.text)));
    if (quickView) {
      const qvHref = typeof quickView === 'string' ? quickView : (toolHref || quoteHref);
      if (qvHref) {
        if (trial) cta.append(document.createTextNode(' '));
        cta.append(wrapIn(document, 'em', link(document, qvHref, 'Quick View')));
      }
    }
    if (cta.childNodes.length) offer.push(cta);
  }
  offer.push(...post);

  const deployment = DEPLOYMENT[normalize(name)]
    || (/\bsaas\b/i.test(name) ? 'SaaS' : 'Self-Hosted');

  return [icon || '', offer, deployment];
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-tools', cells });
  element.replaceWith(block);
}
