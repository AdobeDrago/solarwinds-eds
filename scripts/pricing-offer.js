/*
 * Shared decoration of a pricing "offer" cell (used by cards-products and
 * cards-tools): H3 product name, optional tag, bold "Starts at" price, notes,
 * a plain "Get a Quote" link, a CTA paragraph (bold link = primary button,
 * italic link = secondary button, e.g. "Quick View") and a trial note.
 */
import { createOptimizedPicture } from './aem.js';

/**
 * True when every non-whitespace character of the paragraph belongs to a link.
 * @param {Element} p
 * @returns {boolean}
 */
export function isLinkOnly(p) {
  const links = [...p.querySelectorAll('a[href]')];
  if (!links.length) return false;
  const linkText = links.map((a) => a.textContent).join('').replace(/\s/g, '');
  return linkText === p.textContent.replace(/\s/g, '');
}

/**
 * Turn the formatted links of a CTA paragraph into buttons. decorateButtons
 * (scripts.js) skips paragraphs holding more than one link, so do it here.
 * @param {Element} p
 * @returns {boolean} true when the paragraph is a CTA row
 */
function decorateCta(p) {
  const links = [...p.querySelectorAll('a[href]')];
  const formatted = links.every((a) => a.classList.contains('button') || a.closest('strong, em, b, i'));
  if (!links.length || !formatted || !isLinkOnly(p)) return false;
  links.forEach((a) => {
    if (a.classList.contains('button')) return;
    const strong = a.closest('strong, b');
    const em = a.closest('em, i');
    a.classList.add('button', strong ? 'primary' : 'secondary');
    const outer = [strong, em].filter((el) => el && p.contains(el))
      .sort((x, y) => (x.contains(y) ? -1 : 1))[0];
    if (outer) outer.replaceWith(a);
  });
  p.className = '';
  return true;
}

/**
 * Classify the parts of an offer cell with `${prefix}-…` classes.
 * @param {Element} cell
 * @param {string} prefix block class name
 */
export function decorateOffer(cell, prefix) {
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add(`${prefix}-name`);

  let afterCta = false;
  let seenPrice = false;
  [...cell.querySelectorAll(':scope > p')].forEach((p) => {
    const text = p.textContent.trim();
    if (!text) return;
    if (decorateCta(p)) {
      p.classList.add(`${prefix}-cta`);
      afterCta = true;
      return;
    }
    if (isLinkOnly(p)) {
      p.className = `${prefix}-quote`;
      return;
    }
    const strong = p.querySelector('strong, b');
    if (!seenPrice && strong && !p.querySelector('a') && strong.textContent.trim() === text) {
      p.classList.add(`${prefix}-price`);
      seenPrice = true;
      return;
    }
    if (afterCta) p.classList.add(`${prefix}-trial`);
    else if (!seenPrice && p.previousElementSibling === heading && text.length <= 24) {
      p.classList.add(`${prefix}-tag`);
    } else p.classList.add(`${prefix}-note`);
  });
}

/**
 * Replace the icon cell's raster picture with an optimized one. SVG icons are
 * kept as authored: they are resolution-independent, and a webp/width source
 * for a vector file gains nothing.
 * @param {Element} cell
 */
export function optimizeIcon(cell) {
  cell.querySelectorAll('picture > img').forEach((img) => {
    const { pathname } = new URL(img.src, window.location.href);
    if (/\.svg$/i.test(pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]));
  });
}

/**
 * True when a cell holds a picture and no text (an icon/image cell).
 * @param {Element} cell
 * @returns {boolean}
 */
export function isImageCell(cell) {
  return !!cell.querySelector('picture, img') && !cell.textContent.trim();
}
