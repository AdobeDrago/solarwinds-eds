/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero. Source: https://www.solarwinds.com/
 * Builder.io source: structural/tag-based extraction, no visibility checks.
 *
 * Output (1 column, matches blocks/hero-banner/hero-banner.js):
 *   row 1: left and right decorative images (document order)
 *   row 2: heading + CTA
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  const images = [...element.querySelectorAll('img')].filter((img) => {
    const src = img.getAttribute('src') || '';
    return src && !src.startsWith('data:') && !/builder-pixel/.test(img.className);
  });

  const heading = element.querySelector('h1, h2, h3, h4');
  const paragraphs = [...element.querySelectorAll('p')].filter((p) => clean(p.textContent));
  const ctas = [...element.querySelectorAll('a[href]')].filter((a) => clean(a.textContent));

  const content = [];
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = clean(heading.textContent);
    content.push(h);
  }
  paragraphs.forEach((para) => {
    const p = document.createElement('p');
    p.textContent = clean(para.textContent);
    content.push(p);
  });
  ctas.forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = clean(a.textContent);
    p.append(link);
    content.push(p);
  });

  if (!content.length && !images.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (images.length) cells.push([images]);
  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
