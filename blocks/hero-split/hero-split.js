import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * A cell counts as media when it holds at least one picture and no text.
 * @param {Element} cell
 * @returns {boolean}
 */
function isMediaCell(cell) {
  return !!cell.querySelector('picture') && !cell.textContent.trim();
}

/**
 * Hero split: text content on one side, a large product image on the other.
 * Authored as a 1-column table (row 1: image, row 2: heading + text + CTA);
 * row order and extra/missing cells are tolerated.
 * @param {Element} block
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-split-content';
  const media = document.createElement('div');
  media.className = 'hero-split-media';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    const target = isMediaCell(cell) ? media : content;
    target.append(...cell.childNodes);
  });

  media.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, true, [
      { media: '(min-width: 900px)', width: '1600' },
      { width: '900' },
    ]);
    img.closest('picture').replaceWith(optimized);
  });

  const children = [content];
  if (media.querySelector('picture')) children.push(media);
  else block.classList.add('hero-split-no-media');

  block.replaceChildren(...children);
}
