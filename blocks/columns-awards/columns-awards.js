import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns awards: a large heading beside a grid of award badge images.
 * Authored as 1 row, 2 columns (col 1: heading; col 2: badge images). Badges
 * spread across several cells, or wrapped in links, are collected into one grid.
 * @param {Element} block
 */
export default function decorate(block) {
  const heading = document.createElement('div');
  heading.className = 'columns-awards-heading';
  const grid = document.createElement('ul');
  grid.className = 'columns-awards-grid';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    [...cell.querySelectorAll('picture')].forEach((pic) => {
      const link = pic.closest('a');
      const wrapper = link && cell.contains(link) ? link : pic;
      const parent = wrapper.parentElement;
      wrapper.remove();
      // drop the now-empty paragraph that held the badge
      if (parent && parent !== cell && !parent.textContent.trim() && !parent.children.length) {
        parent.remove();
      }

      const img = pic.querySelector('img');
      const badge = img
        ? createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }])
        : pic;
      const item = document.createElement('li');
      item.className = 'columns-awards-item';
      if (wrapper !== pic) {
        const a = link.cloneNode(false);
        a.append(badge);
        item.append(a);
      } else {
        item.append(badge);
      }
      grid.append(item);
    });

    // whatever text remains is the heading content
    if (cell.textContent.trim()) heading.append(...cell.childNodes);
  });

  // the heading cell is often imported as plain text (auto-wrapped in a <p>);
  // promote a lone text paragraph to a heading so the section keeps its title semantics
  const headingEls = [...heading.children];
  const hasBlockChild = headingEls.some((el) => el.matches('p, div, ul, ol'));
  if (!heading.querySelector('h1, h2, h3, h4, h5, h6')) {
    if (headingEls.length === 1 && headingEls[0].tagName === 'P') {
      const h2 = document.createElement('h2');
      h2.append(...headingEls[0].childNodes);
      headingEls[0].replaceWith(h2);
    } else if (!hasBlockChild && heading.textContent.trim()) {
      // bare inline text/formatting without a wrapper
      const h2 = document.createElement('h2');
      h2.append(...heading.childNodes);
      heading.append(h2);
    }
  }

  const children = [];
  if (heading.childNodes.length) children.push(heading);
  if (grid.children.length) children.push(grid);
  block.replaceChildren(...children);
}
