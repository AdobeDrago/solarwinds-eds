/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-awards. Base: columns. Source: https://www.solarwinds.com/
 * Builder.io source: structural/tag-based extraction, no visibility checks.
 *
 * Source: .builder-columns with a heading paragraph ("Awarded for <strong>excellence</strong>
 * since 1999") and a grid of award badge <img>s.
 *
 * Output (matches blocks/columns-awards/columns-awards.js):
 *   1 row, 2 columns — col 1: heading text; col 2: badge images (optionally linked)
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  // Heading content: headings/paragraphs carrying text (keeps inline <strong>).
  const textEls = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6, p')]
    .filter((el) => clean(el.textContent))
    .filter((el, _, arr) => !arr.some((o) => o !== el && o.contains(el)));

  const headingCell = textEls.map((el) => {
    const out = document.createElement(el.tagName === 'P' ? 'p' : el.tagName.toLowerCase());
    out.innerHTML = el.innerHTML;
    out.querySelectorAll('div, span').forEach((w) => w.replaceWith(...w.childNodes));
    return out;
  });

  const badges = [...element.querySelectorAll('img')]
    .filter((img) => {
      const src = img.getAttribute('src') || '';
      return src && !src.startsWith('data:') && !/builder-pixel/.test(img.className);
    })
    .map((img) => {
      const link = img.closest('a[href]');
      if (link && element.contains(link)) {
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.append(img);
        return a;
      }
      return img;
    });

  if (!headingCell.length && !badges.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[headingCell.length ? headingCell : '', badges.length ? badges : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-awards', cells });
  element.replaceWith(block);
}
