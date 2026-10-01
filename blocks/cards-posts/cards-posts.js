import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  buildMeta, buildTerms, clearButtons, extractImage, isImageCell, isPostTitle, isTermsOnly,
} from '../../scripts/blog.js';

/**
 * Cards posts: a row of blog post teasers (image, category pills, linked title,
 * "date | author"). Authored as one row per post (col 1: image, linked or not;
 * col 2: optional category link paragraph(s), linked title, date, author link).
 * Cards are not one big link: the category and author links stay separate.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-posts-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.some((cell) => cell.textContent.trim() || cell.querySelector('picture'))) return;

    const li = document.createElement('li');
    li.className = 'cards-posts-card';
    const body = document.createElement('div');
    body.className = 'cards-posts-card-body';

    const imageCell = cells.find(isImageCell);
    cells.filter((cell) => cell !== imageCell).forEach((cell) => body.append(...cell.childNodes));

    // title: the first heading, else the first title-like paragraph
    const els = [...body.children].filter((el) => el.textContent.trim());
    const title = els.find((el) => /^H[1-6]$/.test(el.tagName)) || els.find(isPostTitle);
    clearButtons(body);

    if (title) {
      title.classList.add('cards-posts-card-title');
      const index = els.indexOf(title);
      const before = els.slice(0, index).filter(isTermsOnly);
      const after = els.slice(index + 1);
      if (before.length) {
        const terms = buildTerms(before, 'cards-posts');
        before.forEach((el) => el.remove());
        title.before(terms);
      }
      if (after.length) {
        const meta = buildMeta(after, 'cards-posts');
        after.forEach((el) => el.remove());
        title.after(meta);
      }
    }

    const postLink = title ? title.querySelector('a[href]') : null;
    const image = imageCell ? extractImage(imageCell, postLink && postLink.getAttribute('href')) : null;
    if (image) {
      const media = document.createElement('div');
      media.className = 'cards-posts-card-image';
      media.append(image);
      li.append(media);
    } else {
      li.classList.add('cards-posts-card-no-image');
    }
    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
      { width: '750' },
    ]));
  });

  block.replaceChildren(ul);
}
