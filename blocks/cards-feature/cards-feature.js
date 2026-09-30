import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards feature: a row of text cards (heading, description, CTA).
 * Authored as one row per card; each row usually has one cell, but an optional
 * image cell is tolerated. A paragraph holding only links is marked as the CTA
 * so it can be pinned to the card's bottom edge.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-feature-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-feature-card';
    [...row.children].forEach((cell) => {
      const isImage = cell.querySelector('picture') && !cell.textContent.trim();
      cell.className = isImage ? 'cards-feature-card-image' : 'cards-feature-card-body';
      li.append(cell);
    });
    if (!li.children.length) return;

    li.querySelectorAll('.cards-feature-card-body > p').forEach((p) => {
      const links = p.querySelectorAll('a');
      const text = p.textContent.trim();
      const linkText = [...links].map((a) => a.textContent.trim()).join('');
      if (links.length && text.replace(/\s/g, '') === linkText.replace(/\s/g, '')) {
        p.classList.add('cards-feature-card-cta');
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
