/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-event. Base: columns. Source: https://www.solarwinds.com/fr
 * Template: home (French World Tour band "On prend la route."). Generated: 2026-10-01.
 *
 * Source (Builder.io, hashed class names -> structural/tag-based extraction; validated
 * against block-context/columns-event/source.html):
 *   section.builder-63cc92ea...
 *     > img[alt="gidget"] (small vertical SVG accent)          -> dropped (block paints it)
 *     > div
 *         > div > img (promo banner) + img[alt="card shadow"]  -> promo img kept,
 *                                                                 dot pattern dropped
 *         > div > ... h2 (span bold) / p / a[href] (pill CTA)
 *
 * Output (matches blocks/columns-event/columns-event.js):
 *   1 row, 2 cells: image cell (img, + link if the image is linked) | copy cell
 *   copy cell: H2, P..., P > a (CTA, absolute href kept as authored in the source)
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

// Decorative images the block paints itself: the gidget SVG and the dot-pattern shadow.
function isDecorative(img) {
  const src = img.getAttribute('src') || '';
  const alt = clean(img.getAttribute('alt')).toLowerCase();
  if (!src || src.startsWith('data:') || /builder-pixel/.test(img.className)) return true;
  if (/gidget/i.test(src) || alt === 'gidget') return true;
  if (/dot[_ -]?pattern|card[_ -]?shadow/i.test(src) || alt === 'card shadow') return true;
  return false;
}

export default function parse(element, { document }) {
  // Drop A/B variant B if the cleanup transformer has not already done so.
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  // --- image cell ---
  let imageCell = null;
  const srcImg = [...element.querySelectorAll('img')].find((img) => !isDecorative(img));
  if (srcImg) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src');
    img.alt = clean(srcImg.getAttribute('alt'));
    imageCell = [img];
    const imgLink = srcImg.closest('a[href]');
    if (imgLink) {
      const a = document.createElement('a');
      a.href = imgLink.getAttribute('href');
      a.textContent = imgLink.getAttribute('href');
      imageCell.push(a);
    }
  }

  // --- copy cell ---
  const copy = [];
  const heading = element.querySelector('h1, h2, h3, h4');
  if (heading && clean(heading.textContent)) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(heading.textContent);
    copy.push(h2);
  }

  [...element.querySelectorAll('p')]
    .filter((p) => clean(p.textContent) && !p.closest('a') && !heading?.contains(p))
    .forEach((para) => {
      const p = document.createElement('p');
      p.textContent = clean(para.textContent);
      copy.push(p);
    });

  [...element.querySelectorAll('a[href]')]
    .filter((a) => clean(a.textContent) && !a.querySelector('img'))
    .forEach((src) => {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = src.getAttribute('href');
      a.textContent = clean(src.textContent);
      p.append(a);
      copy.push(p);
    });

  if (!imageCell && !copy.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  let row;
  if (!imageCell) row = [copy];
  else if (!copy.length) row = [imageCell];
  else row = [imageCell, copy];

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-event', cells });
  element.replaceWith(block);
}
