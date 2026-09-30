import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Replace nested anchors with spans so the whole card can be one link.
 * @param {Element} root
 */
function unwrapLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    const span = document.createElement('span');
    span.className = 'cards-resources-card-link-text';
    span.append(...a.childNodes);
    a.replaceWith(span);
  });
}

/**
 * Cards resources: a bento grid of linked resource tiles. The first tile is
 * featured (wide, image beside text); the rest stack image over text.
 * Authored as one row per card (col 1: image; col 2: eyebrow + linked title).
 * The first link found in a card becomes the link for the whole tile.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-resources-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-resources-card';

    const image = document.createElement('div');
    image.className = 'cards-resources-card-image';
    const body = document.createElement('div');
    body.className = 'cards-resources-card-body';
    cells.forEach((cell) => {
      const isImage = cell.querySelector('picture') && !cell.textContent.trim();
      (isImage ? image : body).append(...cell.childNodes);
    });

    // an eyebrow is a short leading paragraph that precedes the title
    const textEls = [...body.children].filter((el) => el.textContent.trim());
    if (textEls.length > 1 && textEls[0].tagName === 'P') {
      textEls[0].classList.add('cards-resources-card-eyebrow');
    }
    const title = textEls.find((el) => !el.classList.contains('cards-resources-card-eyebrow'));
    if (title) title.classList.add('cards-resources-card-title');

    const link = image.querySelector('a') || body.querySelector('a');
    const href = link ? link.getAttribute('href') : null;
    const linkTitle = link ? link.getAttribute('title') : null;
    unwrapLinks(image);
    unwrapLinks(body);
    // decorateButtons (scripts.js) may have marked a bold title as a button; undo that for tiles
    [image, body].forEach((part) => part.querySelectorAll('.button-wrapper')
      .forEach((p) => p.classList.remove('button-wrapper')));

    const container = href ? document.createElement('a') : document.createElement('div');
    container.className = 'cards-resources-card-inner';
    if (href) {
      container.href = href;
      if (linkTitle) container.title = linkTitle;
    }
    if (image.children.length) container.append(image);
    else li.classList.add('cards-resources-card-no-image');
    container.append(body);
    li.append(container);
    ul.append(li);
  });

  const first = ul.firstElementChild;
  if (first && ul.children.length > 1) first.classList.add('cards-resources-card-featured');

  ul.querySelectorAll('picture > img').forEach((img) => {
    const featured = img.closest('.cards-resources-card-featured');
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
      { width: featured ? '1200' : '750' },
    ]));
  });

  block.replaceChildren(ul);
}
