import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// social networks, detected by link hostname; name = /icons/{name}.svg
const SOCIAL_NETWORKS = [
  ['facebook', ['facebook.com']],
  ['instagram', ['instagram.com']],
  ['x', ['twitter.com', 'x.com']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['linkedin', ['linkedin.com']],
];

/**
 * Returns the social network name for a link, or null.
 * @param {HTMLAnchorElement} a
 * @returns {string|null}
 */
function getSocialNetwork(a) {
  let hostname;
  try {
    ({ hostname } = new URL(a.href));
  } catch (e) {
    return null;
  }
  const match = SOCIAL_NETWORKS.find(([, hosts]) => hosts
    .some((host) => hostname === host || hostname.endsWith(`.${host}`)));
  return match ? match[0] : null;
}

/**
 * Classifies an authored footer section by its content, so authors can
 * add/drop/reorder sections without breaking the layout.
 * @param {Element} section
 * @param {number} index
 * @returns {string} footer class name
 */
function classifySection(section, index) {
  const list = section.querySelector('ul, ol');
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  const links = list ? [...list.querySelectorAll('a[href]')] : [];
  if (links.length && links.every((a) => getSocialNetwork(a))) return 'footer-social';
  if (heading && list) return 'footer-col';
  if (list) return 'footer-legal';
  if (index === 0 && section.querySelector('img, picture')) return 'footer-brand';
  return 'footer-copyright';
}

/**
 * Turns the text social links into icon links; the link text stays as the
 * accessible name (visually hidden) and the heading is kept for screen readers.
 * @param {Element} section
 */
function decorateSocial(section) {
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('footer-sr-only');

  section.querySelectorAll('ul a[href]').forEach((a) => {
    const network = getSocialNetwork(a);
    const label = document.createElement('span');
    label.className = 'footer-sr-only';
    label.append(...a.childNodes);
    const icon = document.createElement('span');
    icon.className = `footer-social-icon footer-social-icon-${network}`;
    icon.setAttribute('aria-hidden', 'true');
    a.append(icon, label);
    a.classList.add('footer-social-link');
    if (!label.textContent.trim()) a.setAttribute('aria-label', network);
  });

  // the CTA is an outlined pill on the source, not the filled primary button
  const cta = section.querySelector('a.button');
  if (cta) {
    cta.classList.remove('primary', 'accent');
    cta.classList.add('secondary');
  }
}

/**
 * Decorates the blog footer (pages with the "blog" template) from its own
 * fragment (/blog/footer), authored like /footer: brand, link columns whose
 * heading is a link, social links + CTA, legal links, copyright. It builds its
 * own wrappers and class names, so none of the main footer's layout applies.
 * @param {Element} block The footer block element
 * @param {Element} fragment The loaded footer fragment
 */
function decorateBlogFooter(block, fragment) {
  const sections = [...fragment.children];
  sections.forEach((section, i) => section.classList.add(`blog-${classifySection(section, i)}`));
  const find = (kind) => sections.filter((s) => s.classList.contains(`blog-footer-${kind}`));

  const create = (className) => {
    const el = document.createElement('div');
    el.className = className;
    return el;
  };

  block.textContent = '';
  block.classList.add('footer-blog');
  const footer = create('blog-footer');

  const main = create('blog-footer-main');
  const brand = find('brand')[0];
  if (brand) {
    const logo = brand.querySelector('picture, img');
    const logoP = logo?.closest('p');
    logoP?.classList.add('blog-footer-logo');
    brand.querySelectorAll('p').forEach((p) => {
      if (p !== logoP) p.classList.add('blog-footer-about');
    });
    brand.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
    main.append(brand);
  }

  const links = create('blog-footer-links');
  find('col').forEach((col) => links.append(col));
  find('social').forEach((social) => {
    decorateSocial(social);
    // the CTA is the source's outlined pill on black, styled here
    social.querySelectorAll('a.button').forEach((a) => {
      a.className = 'blog-footer-cta';
      a.removeAttribute('title');
      a.closest('p')?.classList.remove('button-wrapper');
    });
    links.append(social);
  });
  main.append(links);
  footer.append(main, ...find('legal'), ...find('copyright'));

  block.append(footer);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  // blog pages (template "blog") get the blog footer, built from their own fragment
  if (document.body.classList.contains('blog')) {
    decorateBlogFooter(block, fragment);
    return;
  }

  // authored as a flat sequence of top-level sections (survives DA's
  // div-stripping since only nested divs get flattened): brand, link
  // columns, social/CTA, legal links, copyright
  const sections = [...fragment.children];
  sections.forEach((section, i) => section.classList.add(classifySection(section, i)));

  block.textContent = '';
  const footer = document.createElement('div');

  const topWrap = document.createElement('div');
  topWrap.className = 'footer-top';
  const brand = sections.find((s) => s.classList.contains('footer-brand'));
  if (brand) topWrap.append(brand);

  const columnsWrap = document.createElement('div');
  columnsWrap.className = 'footer-columns';
  sections
    .filter((s) => s.matches('.footer-col, .footer-social'))
    .forEach((s) => columnsWrap.append(s));
  columnsWrap.querySelectorAll('.footer-social').forEach(decorateSocial);
  topWrap.append(columnsWrap);
  footer.append(topWrap);

  sections
    .filter((s) => s.matches('.footer-legal, .footer-copyright'))
    .forEach((s) => footer.append(s));

  block.append(footer);
}
