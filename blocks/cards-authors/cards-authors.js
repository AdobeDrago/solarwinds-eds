import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Replace nested anchors with spans so the whole card can be one link.
 * @param {Element} root
 */
function unwrapLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    const span = document.createElement('span');
    span.append(...a.childNodes);
    a.replaceWith(span);
  });
}

/**
 * Cards authors: a row of featured blog authors (round headshot, name, job title).
 * Authored as one row per author (col 1: headshot; col 2: linked name, job title).
 * The first link found in a card (normally the name) becomes the link for the whole card.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-authors-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.some((cell) => cell.textContent.trim() || cell.querySelector('picture'))) return;

    const li = document.createElement('li');
    li.className = 'cards-authors-card';
    const image = document.createElement('div');
    image.className = 'cards-authors-card-image';
    const body = document.createElement('div');
    body.className = 'cards-authors-card-body';
    cells.forEach((cell) => {
      const isImage = cell.querySelector('picture') && !cell.textContent.trim();
      (isImage ? image : body).append(...cell.childNodes);
    });

    // first text element is the name, the rest (job title) follows it
    const textEls = [...body.children].filter((el) => el.textContent.trim());
    if (textEls[0]) textEls[0].classList.add('cards-authors-card-name');

    const link = body.querySelector('a[href]') || image.querySelector('a[href]');
    const href = link ? link.getAttribute('href') : null;
    unwrapLinks(image);
    unwrapLinks(body);
    // decorateButtons (scripts.js) may have marked a bold name as a button; undo that
    body.querySelectorAll('.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));

    const container = document.createElement(href ? 'a' : 'div');
    container.className = 'cards-authors-card-inner';
    if (href) container.href = href;
    if (image.querySelector('picture')) container.append(image);
    container.append(body);
    li.append(container);
    ul.append(li);
  });

  // the headshot is decorative next to the name (keeps the link name from repeating)
  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, '', false, [
      { width: '240' },
    ]));
  });

  block.replaceChildren(ul);
}
