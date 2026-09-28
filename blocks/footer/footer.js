import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');

  // authored as a flat sequence of top-level sections (survives DA's
  // div-stripping since only nested divs get flattened): brand, 5 link
  // columns, social/CTA, legal links, copyright
  const sections = [...fragment.children];
  const classNames = ['footer-brand', 'footer-col', 'footer-col', 'footer-col',
    'footer-col', 'footer-col', 'footer-social', 'footer-legal', 'footer-copyright'];
  sections.forEach((section, i) => {
    if (classNames[i]) section.classList.add(classNames[i]);
  });

  const columnsWrap = document.createElement('div');
  columnsWrap.className = 'footer-columns';
  sections
    .filter((s) => s.classList.contains('footer-col') || s.classList.contains('footer-social'))
    .forEach((s) => columnsWrap.append(s));

  const topWrap = document.createElement('div');
  topWrap.className = 'footer-top';
  const brand = sections.find((s) => s.classList.contains('footer-brand'));
  if (brand) topWrap.append(brand);
  topWrap.append(columnsWrap);
  footer.append(topWrap);

  const legal = sections.find((s) => s.classList.contains('footer-legal'));
  if (legal) footer.append(legal);
  const copyright = sections.find((s) => s.classList.contains('footer-copyright'));
  if (copyright) footer.append(copyright);

  block.append(footer);
}
