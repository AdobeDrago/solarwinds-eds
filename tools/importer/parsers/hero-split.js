/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-split. Base: hero. Source: https://www.solarwinds.com/
 * Source is Builder.io (hashed class names) — extraction is structural/tag-based.
 * Visibility is never consulted (A/B variant A may be CSS-hidden on the live page).
 *
 * Output (1 column, matches blocks/hero-split/hero-split.js):
 *   row 1: product image
 *   row 2: heading, subheading (as paragraph), CTA link
 */
function cleanLink(document, a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href') || a.href;
  link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
  return link;
}

export default function parse(element, { document }) {
  // Drop A/B variant B if the cleanup transformer has not already done so.
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  // Content image: first real (non data-URI, non tracking pixel) image.
  const image = [...element.querySelectorAll('img')].find((img) => {
    const src = img.getAttribute('src') || '';
    return src && !src.startsWith('data:') && !/builder-pixel/.test(img.className);
  });

  const heading = element.querySelector('h1') || element.querySelector('h2, h3');

  const contentCell = [];
  if (heading) {
    const h1 = document.createElement('h1');
    h1.innerHTML = heading.innerHTML;
    // unwrap Builder.io text wrappers inside the heading
    h1.querySelectorAll('div, span').forEach((w) => w.replaceWith(...w.childNodes));
    contentCell.push(h1);
  }

  // Subheading: headings/paragraphs after the main heading
  [...element.querySelectorAll('h2, h3, h4, p')]
    .filter((el) => el !== heading && !heading?.contains(el) && el.textContent.trim())
    .forEach((el) => {
      const p = document.createElement('p');
      p.textContent = el.textContent.replace(/\s+/g, ' ').trim();
      contentCell.push(p);
    });

  const ctas = [...element.querySelectorAll('a[href]')].filter((a) => a.textContent.trim());
  ctas.forEach((a) => {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.append(cleanLink(document, a));
    p.append(strong);
    contentCell.push(p);
  });

  if (!image && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (image) cells.push([image]);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-split', cells });
  element.replaceWith(block);
}
