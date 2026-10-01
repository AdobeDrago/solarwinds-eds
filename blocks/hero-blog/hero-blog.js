import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  buildMeta, clearButtons, extractImage, isImageCell,
} from '../../scripts/blog.js';

/**
 * Hero blog: the featured post on the blog home. Linked headline with a
 * "date | author | category" meta line on one side, a large linked image on the other.
 * Authored as a 1-column table (row 1: image; row 2: linked heading + date, author and
 * category paragraphs); row order and extra/missing cells are tolerated.
 * @param {Element} block
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-blog-content';
  const media = document.createElement('div');
  media.className = 'hero-blog-media';

  const cells = [...block.querySelectorAll(':scope > div > div')];
  const imageCell = cells.find(isImageCell);
  cells.filter((cell) => cell !== imageCell).forEach((cell) => content.append(...cell.childNodes));
  clearButtons(content);

  // everything after the headline is the meta line
  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.classList.add('hero-blog-title');
    const after = [];
    let next = heading.nextElementSibling;
    while (next) {
      if (next.textContent.trim()) after.push(next);
      next = next.nextElementSibling;
    }
    if (after.length) {
      const meta = buildMeta(after, 'hero-blog');
      after.forEach((el) => el.remove());
      heading.after(meta);
    }
  }

  const postLink = heading ? heading.querySelector('a[href]') : null;
  const image = imageCell ? extractImage(imageCell, postLink && postLink.getAttribute('href')) : null;
  if (image) {
    media.append(image);
    media.querySelectorAll('picture > img').forEach((img) => {
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [
        { media: '(min-width: 768px)', width: '1200' },
        { width: '750' },
      ]));
    });
  }

  const children = [content];
  if (media.children.length) children.push(media);
  else block.classList.add('hero-blog-no-media');
  block.replaceChildren(...children);
}
