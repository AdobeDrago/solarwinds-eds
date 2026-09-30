import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero banner: centered heading + CTA flanked by two decorative images.
 * Authored as 1 column (row 1: left and right decorative images; row 2: heading + CTA).
 * One image renders on the left only; three or more are split across both sides.
 * @param {Element} block
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-banner-content';
  const pictures = [];

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    cell.querySelectorAll('picture').forEach((pic) => {
      const parent = pic.parentElement;
      pictures.push(pic);
      pic.remove();
      if (parent && parent !== cell && !parent.textContent.trim() && !parent.children.length) {
        parent.remove();
      }
    });
    if (cell.textContent.trim() || cell.children.length) content.append(...cell.childNodes);
  });

  // a paragraph holding only links is the CTA, whether or not it was authored bold/italic
  content.querySelectorAll(':scope > p').forEach((p) => {
    const links = [...p.querySelectorAll('a')];
    const linkText = links.map((a) => a.textContent).join('').replace(/\s/g, '');
    if (links.length && p.textContent.replace(/\s/g, '') === linkText) {
      p.classList.add('hero-banner-cta');
    }
  });

  const makeDecor = (side, pics) => {
    const decor = document.createElement('div');
    decor.className = `hero-banner-decor hero-banner-decor-${side}`;
    decor.setAttribute('aria-hidden', 'true');
    pics.forEach((pic) => {
      const img = pic.querySelector('img');
      decor.append(img
        ? createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])
        : pic);
    });
    return decor;
  };

  const half = Math.ceil(pictures.length / 2);
  const left = makeDecor('left', pictures.slice(0, half));
  const right = makeDecor('right', pictures.slice(half));

  block.replaceChildren(left, content, right);
  if (!pictures.length) block.classList.add('hero-banner-no-media');
}
