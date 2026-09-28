import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Rebuilds a flat, heading-delimited authored megamenu (h4 + p/ul siblings,
 * as authored content survives DA's markdown round-trip) into the nested
 * rail / groups / footer DOM used for styling.
 * @param {Element} navSection The <li> nav item, possibly containing h4s
 * @returns {Element|null} The built .nav-megamenu element, or null if none
 */
function buildMegaMenu(navSection) {
  const heading = navSection.querySelector('h4');
  if (!heading) return null;

  // split remaining siblings into segments, one per h4
  const segments = [];
  let current = null;
  [...navSection.children].forEach((el) => {
    if (el.tagName === 'H4') {
      current = { heading: el, nodes: [] };
      segments.push(current);
    } else if (current) {
      current.nodes.push(el);
    }
  });
  if (!segments.length) return null;

  const megamenu = document.createElement('div');
  megamenu.className = 'nav-megamenu';
  const body = document.createElement('div');
  body.className = 'megamenu-body';
  const groupsWrap = document.createElement('div');
  groupsWrap.className = 'megamenu-groups';
  const footerEl = document.createElement('div');
  footerEl.className = 'megamenu-footer';

  segments.forEach((seg, i) => {
    const isRail = i === 0;
    const isFooter = !isRail && i === segments.length - 1
      && seg.heading.textContent.trim() === 'Not sure where to start?';

    // rail/footer get their own container; every other segment is a group
    const container = document.createElement('div');
    if (isRail) container.className = 'megamenu-rail';
    else if (!isFooter) container.className = 'megamenu-group';

    const title = document.createElement('p');
    if (!isRail && !isFooter) title.className = 'megamenu-group-title';
    const strong = document.createElement('strong');
    strong.textContent = seg.heading.textContent;
    title.append(strong);
    container.append(title);

    // group consecutive <ul> siblings as columns (groups only; rail/footer
    // uls are styled directly via descendant selectors)
    const cols = !isRail && !isFooter ? document.createElement('div') : null;
    if (cols) cols.className = 'megamenu-group-cols';
    seg.nodes.forEach((node) => {
      if (node.tagName === 'UL') {
        if (isFooter) node.classList.add('megamenu-footer-links');
        if (cols) cols.append(node);
        else container.append(node);
      } else if (node.tagName === 'P') {
        // decorateButtons (run earlier, in decorateMain) already turned any
        // <strong><a></strong> into <p class="button-wrapper"><a class="button">
        const a = node.querySelector('a');
        const isSoleLink = a && node.textContent.trim() === a.textContent.trim();
        if (!node.classList.contains('button-wrapper')) {
          if (isSoleLink && !isRail && !isFooter) node.classList.add('megamenu-group-overview');
          else if (node.querySelector('em')) node.classList.add('megamenu-rail-label');
          else if (!isRail && !isFooter) node.classList.add('megamenu-group-desc');
        }
        container.append(node);
      }
    });
    if (cols && cols.children.length) container.append(cols);
    seg.heading.remove();

    if (isRail) body.append(container);
    else if (isFooter) footerEl.append(...container.childNodes);
    else groupsWrap.append(container);
  });

  body.append(groupsWrap);
  megamenu.append(body, footerEl);
  return megamenu;
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';

  // optional promo banner: authored as an extra leading section before brand/sections/tools
  let banner = null;
  if (fragment.children.length === 4) {
    banner = fragment.firstElementChild;
    banner.remove();
    banner.classList.add('nav-banner');
  }

  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const megamenu = buildMegaMenu(navSection);
      if (megamenu) {
        navSection.append(megamenu);
        navSection.classList.add('nav-drop');
      } else if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
      }
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  if (banner) block.append(banner);
  block.append(navWrapper);
}
