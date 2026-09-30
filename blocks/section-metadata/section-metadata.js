import { toClassName, toCamelCase } from '../../scripts/aem.js';

export default function decorate(block) {
  const wrapper = block.parentElement;
  const parent = block.closest('.section') || wrapper;
  [...block.children].forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const key = toCamelCase(cols[0].textContent);
        const value = cols[1].textContent.trim();
        if (key && value) {
          if (key === 'style') {
            value.split(',').filter((style) => !!style.trim()).forEach((style) => {
              parent.classList.add(toClassName(style.trim()));
            });
          } else {
            parent.dataset[key] = value;
          }
        }
      }
    }
  });
  block.remove();
  if (wrapper !== parent && !wrapper.children.length) wrapper.remove();
}
