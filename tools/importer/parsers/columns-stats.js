/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-stats. Base: columns. Source: https://www.solarwinds.com/
 * Builder.io source: structural/tag-based extraction, no visibility checks.
 *
 * Source: a row container whose children are stat items; each item starts with a
 * text-only element holding the value ("84%", "20", "300K+") followed by one or more
 * descriptor paragraphs.
 *
 * Output (matches blocks/columns-stats/columns-stats.js):
 *   1 row, N columns — each cell: <p><strong>value</strong></p><p>descriptor</p>
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

const ownText = (el) => clean([...el.childNodes]
  .filter((n) => n.nodeType === 3)
  .map((n) => n.textContent)
  .join(' '));

// First element (depth-first) with at least two text-bearing element children.
function findRow(root) {
  const queue = [root];
  while (queue.length) {
    const el = queue.shift();
    const kids = [...el.children].filter((k) => !/^(STYLE|SCRIPT)$/.test(k.tagName) && clean(k.textContent));
    if (kids.length >= 2) return { row: el, items: kids };
    queue.push(...el.children);
  }
  return null;
}

export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  const found = findRow(element);
  if (!found) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = found.items.map((item) => {
    // Value: first element carrying its own text (not a <p> descriptor).
    const all = [...item.querySelectorAll('*')].filter((el) => !/^(STYLE|SCRIPT)$/.test(el.tagName));
    const valueEl = all.find((el) => el.tagName !== 'P' && ownText(el))
      || all.find((el) => ownText(el));
    const value = valueEl ? ownText(valueEl) : '';

    let label = [...item.querySelectorAll('p')]
      .filter((p) => p !== valueEl)
      .map((p) => clean(p.textContent))
      .filter(Boolean)
      .join(' ');
    if (!label) label = clean(clean(item.textContent).replace(value, ''));

    const cell = [];
    if (value) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(strong);
      cell.push(p);
    }
    if (label) {
      const p = document.createElement('p');
      p.textContent = label;
      cell.push(p);
    }
    return cell;
  });

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-stats', cells });
  element.replaceWith(block);
}
