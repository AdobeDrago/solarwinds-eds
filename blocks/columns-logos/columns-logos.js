import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns logos: a short heading beside a row of customer logos.
 * Authored as 1 row, 2 columns (col 1: heading, col 2: logo images). Logos may
 * also be spread across several cells or wrapped in links; all are collected
 * into one list.
 * @param {Element} block
 */
export default function decorate(block) {
  const heading = document.createElement('div');
  heading.className = 'columns-logos-heading';
  const list = document.createElement('ul');
  list.className = 'columns-logos-list';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    [...cell.querySelectorAll('picture')].forEach((pic) => {
      const link = pic.closest('a');
      const wrapper = link && cell.contains(link) ? link : pic;
      const parent = wrapper.parentElement;
      wrapper.remove();
      // drop the now-empty paragraph that held the logo
      if (parent && parent !== cell && !parent.textContent.trim() && !parent.children.length) {
        parent.remove();
      }

      // only re-optimize same-origin media; external CDN URLs carry their own
      // transform params (e.g. contrast) that createOptimizedPicture would drop
      const img = pic.querySelector('img');
      const sameOrigin = img && new URL(img.src, window.location.href).origin
        === window.location.origin;
      const logo = sameOrigin
        ? createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }])
        : pic;
      const item = document.createElement('li');
      item.className = 'columns-logos-item';
      if (wrapper !== pic) {
        const a = link.cloneNode(false);
        a.append(logo);
        item.append(a);
      } else {
        item.append(logo);
      }
      list.append(item);
    });

    // whatever text remains is the heading content
    if (cell.textContent.trim()) heading.append(...cell.childNodes);
  });

  const children = [];
  if (heading.childNodes.length) children.push(heading);
  if (list.children.length) children.push(list);
  block.replaceChildren(...children);
}
