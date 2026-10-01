import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * A cell counts as media when it holds a picture and no text other than link text
 * (a linked image may be authored as the picture followed by its URL).
 * @param {Element} cell
 * @returns {boolean}
 */
function isMediaCell(cell) {
  if (!cell.querySelector('picture')) return false;
  const text = cell.cloneNode(true);
  text.querySelectorAll('a').forEach((a) => a.remove());
  return !text.textContent.trim();
}

/**
 * A link to another host (gets the external-link icon).
 * @param {Element} a
 * @returns {boolean}
 */
function isExternal(a) {
  try {
    return new URL(a.href, window.location.href).hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

/**
 * The cell's picture, wrapped in its link when the image is linked.
 * @param {Element} cell
 * @returns {Element}
 */
function extractMedia(cell) {
  const picture = cell.querySelector('picture');
  let link = picture.closest('a');
  if (!link) {
    const textLink = cell.querySelector('a[href]');
    if (textLink) {
      link = document.createElement('a');
      link.href = textLink.getAttribute('href');
      textLink.remove();
      picture.replaceWith(link);
      link.append(picture);
    }
  }
  const img = picture.querySelector('img');
  picture.replaceWith(createOptimizedPicture(img.src, img.alt, false, [
    { media: '(min-width: 768px)', width: '1200' },
    { width: '750' },
  ]));
  return link || cell.querySelector('picture');
}

/**
 * Columns callout: two-column event promo, copy (headline, text, CTA link) beside a
 * large (linked) image. Authored as 1 row, 2 cells; cell order decides the image side.
 * Option `background` (CSS only): decorative patterned band behind the block.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const mediaCell = cells.find(isMediaCell);

  const content = document.createElement('div');
  content.className = 'columns-callout-content';
  cells.filter((cell) => cell !== mediaCell).forEach((cell) => content.append(...cell.childNodes));

  // the CTA is the last link-only paragraph: a text link (not a button), with an
  // external-link icon when it leaves the site
  const cta = [...content.querySelectorAll(':scope > p')].reverse().find((p) => {
    const a = p.querySelector('a[href]');
    return a && p.textContent.trim() === a.textContent.trim();
  });
  if (cta) {
    cta.classList.remove('button-wrapper');
    cta.classList.add('columns-callout-cta');
    const link = cta.querySelector('a[href]');
    link.classList.remove('button', 'primary', 'secondary', 'accent');
    if (isExternal(link)) link.classList.add('columns-callout-external');
  }

  if (!mediaCell) {
    block.classList.add('columns-callout-no-media');
    block.replaceChildren(content);
    return;
  }

  const media = document.createElement('div');
  media.className = 'columns-callout-media';
  media.append(extractMedia(mediaCell));

  // keep the authored order: image first puts it on the left
  if (cells.indexOf(mediaCell) === 0) {
    block.classList.add('columns-callout-media-first');
    block.replaceChildren(media, content);
  } else {
    block.replaceChildren(content, media);
  }
}
