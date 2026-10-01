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
 * The cell's picture (optimized), wrapped in its link when the image is linked.
 * @param {Element} cell
 * @returns {Element}
 */
function extractMedia(cell) {
  const picture = cell.querySelector('picture');
  const img = picture.querySelector('img');
  const optimized = img
    ? createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 768px)', width: '1200' },
      { width: '750' },
    ])
    : picture;
  let link = picture.closest('a');
  if (!link) {
    const textLink = cell.querySelector('a[href]');
    if (textLink) {
      link = document.createElement('a');
      link.href = textLink.getAttribute('href');
    }
  }
  if (optimized !== picture) picture.replaceWith(optimized);
  if (link && !link.contains(optimized)) {
    link.replaceChildren(optimized);
  }
  return link || optimized;
}

/**
 * Columns event: full-bleed orange promo band. A promo image (with a decorative
 * dotted-pattern shadow offset behind it) beside a white heading, paragraph and an
 * outlined pill CTA. Authored as 1 row, 2 cells (image | copy); cell order is
 * normalised so the image is always on the left on wider screens.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const mediaCell = cells.find(isMediaCell);

  const content = document.createElement('div');
  content.className = 'columns-event-content';
  cells.filter((cell) => cell !== mediaCell).forEach((cell) => content.append(...cell.childNodes));

  // the CTA is the last link-only paragraph; always render it as the outlined pill
  // (the global secondary button), whether or not the author italicised it
  const cta = [...content.querySelectorAll(':scope > p')].reverse().find((p) => {
    const a = p.querySelector('a[href]');
    return a && !a.querySelector('img') && p.textContent.trim() === a.textContent.trim();
  });
  if (cta) {
    const link = cta.querySelector('a[href]');
    cta.replaceChildren(link);
    cta.className = 'button-wrapper columns-event-cta';
    link.classList.remove('primary', 'accent');
    link.classList.add('button', 'secondary');
  }

  if (!mediaCell) {
    block.classList.add('columns-event-no-media');
    block.replaceChildren(content);
    return;
  }

  const media = document.createElement('div');
  media.className = 'columns-event-media';
  const frame = document.createElement('div');
  frame.className = 'columns-event-frame';
  frame.append(extractMedia(mediaCell));
  media.append(frame);

  block.replaceChildren(media, content);
}
