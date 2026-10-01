/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-pricing. Base: cards. Source: https://www.solarwinds.com/pricing
 * Template: pricing. Generated: 2026-09-30.
 *
 * Source structure (Builder.io, validated against block-context/cards-pricing/source.html):
 *   root .builder-04207812… > div > div (grid) > 4 card divs, each:
 *     span > .builder-text          tier name ("Monitoring & Observability", sometimes wrapped in <p>)
 *     div
 *       div  .builder-text "Starts at:" | div( .builder-text "$" + .builder-text "8" ) | .builder-text unit
 *       a[href]                      CTA ("Request Quote" / "Contact Us")
 *       span > .builder-text > ul    bullets
 *   Builder class ids differ per card, so extraction is structural (grid = common
 *   ancestor of the cards' <ul>s) and text-based. Inline <style> is ignored.
 *
 * Output (blocks/cards-pricing/cards-pricing.js): one row per card, one cell:
 *   H3 tier name / P "Starts at:" / P <strong>$8</strong> / P unit / P CTA link / UL
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

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

function commonAncestor(nodes) {
  if (!nodes.length) return null;
  let anc = nodes[0].parentElement;
  while (anc && !nodes.every((n) => anc.contains(n))) anc = anc.parentElement;
  return anc;
}

// Clean copy of a <ul>: plain-text items (no Builder markup / styles).
function cleanList(document, ul) {
  const list = document.createElement('ul');
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const text = clean(textOf(li));
    if (!text) return;
    const item = document.createElement('li');
    item.textContent = text;
    list.append(item);
  });
  return list.children.length ? list : null;
}

function para(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function parseCard(document, card) {
  // text chunks in document order (outside links and lists)
  let chunks = [...card.querySelectorAll('.builder-text')];
  if (!chunks.length) chunks = [...card.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span')].filter((el) => !el.querySelector('p, span, div'));
  const texts = chunks
    .filter((el) => !el.querySelector('ul, ol') && !el.closest('a, button, ul, ol'))
    .map((el) => clean(textOf(el)))
    .filter(Boolean);

  const ul = card.querySelector('ul');
  const cta = [...card.querySelectorAll('a[href]')].find((a) => !a.closest('ul') && clean(textOf(a)));

  if (!texts.length && !ul) return null;

  const content = [];
  const [name, ...rest] = texts;
  if (name) {
    const h3 = document.createElement('h3');
    h3.textContent = name;
    content.push(h3);
  }

  // Remaining chunks: "Starts at:" label, currency ("$"), amount ("8"), unit.
  let currency = '';
  let priceDone = false;
  const before = [];
  const after = [];
  let price = null;
  rest.forEach((t) => {
    if (!priceDone && /^[^\w\s]{1,3}$/.test(t)) { currency = t; return; }
    if (!priceDone && /^[^\w\s]{0,3}\s*\d[\d.,]*$/.test(t)) {
      price = `${currency}${t}`.replace(/\s+/g, '');
      priceDone = true;
      return;
    }
    (priceDone ? after : before).push(t);
  });
  before.forEach((t) => content.push(para(document, t)));
  if (price) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = price;
    p.append(strong);
    content.push(p);
  }
  after.forEach((t) => content.push(para(document, t)));

  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = clean(textOf(cta));
    p.append(a);
    content.push(p);
  }
  const list = ul && cleanList(document, ul);
  if (list) content.push(list);
  return content;
}

export default function parse(element, { document }) {
  const uls = [...element.querySelectorAll('ul')];
  let cards;
  if (uls.length > 1) {
    const grid = commonAncestor(uls);
    cards = [...grid.children].filter((c) => c.querySelector('ul'));
  } else {
    cards = [element];
  }

  const cells = [];
  cards.forEach((card) => {
    const content = parseCard(document, card);
    if (content && content.length) cells.push([content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-pricing', cells });
  element.replaceWith(block);
}
