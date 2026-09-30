/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-logos. Base: columns. Source: https://www.solarwinds.com/
 * Builder.io source: structural/tag-based extraction, no visibility checks.
 *
 * Output (matches blocks/columns-logos/columns-logos.js):
 *   1 row, 2 columns — col 1: heading, col 2: logo images (optionally linked)
 */
export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  const heading = element.querySelector('h1, h2, h3, h4, h5, h6');

  const logos = [...element.querySelectorAll('img')]
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

  if (!heading && !logos.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const headingCell = [];
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    headingCell.push(h);
  }

  const cells = [[headingCell.length ? headingCell : '', logos.length ? logos : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-logos', cells });
  element.replaceWith(block);
}
