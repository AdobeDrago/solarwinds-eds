/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base: cards. Source: https://www.solarwinds.com/
 * Builder.io source: structural/tag-based extraction, no visibility checks.
 *
 * Source: 3 sibling card wrappers (div), each h3 + p + CTA <a>.
 * Cards are keyed on their heading (block-level), never on the CTA anchors.
 *
 * Output (matches blocks/cards-feature/cards-feature.js):
 *   one row per card; 1 cell (heading, description, CTA) — optional image cell first
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function childOf(root, node) {
  let cur = node;
  while (cur && cur.parentElement !== root) cur = cur.parentElement;
  return cur;
}

function commonAncestor(nodes) {
  let anc = nodes[0].parentElement;
  while (anc && !nodes.every((n) => anc.contains(n))) anc = anc.parentElement;
  return anc;
}

export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  const headings = [...element.querySelectorAll('h2, h3, h4, h5')].filter((h) => clean(h.textContent));
  if (!headings.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const root = headings.length > 1 ? commonAncestor(headings) : element;
  const cards = [];
  headings.forEach((h) => {
    const card = childOf(root, h) || h.parentElement;
    if (card && !cards.includes(card)) cards.push(card);
  });

  const hasImages = cards.some((card) => card.querySelector('img:not([src^="data:"])'));

  const cells = [];
  cards.forEach((card) => {
    const heading = card.querySelector('h2, h3, h4, h5');
    const body = [];
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = clean(heading.textContent);
      body.push(h);
    }
    [...card.querySelectorAll('p')].filter((p) => clean(p.textContent)).forEach((para) => {
      const p = document.createElement('p');
      p.innerHTML = para.innerHTML;
      body.push(p);
    });
    [...card.querySelectorAll('a[href]')]
      .filter((a) => clean(a.textContent) && !a.closest('p'))
      .forEach((a) => {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = clean(a.textContent);
        p.append(link);
        body.push(p);
      });

    if (hasImages) {
      const img = card.querySelector('img:not([src^="data:"])');
      cells.push([img || '', body]);
    } else {
      cells.push([body]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
