import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    // an open tools dropdown closes first, returning focus to its toggle
    const openTool = nav.querySelector('.nav-tools-toggle[aria-expanded="true"]');
    if (openTool) {
      openTool.setAttribute('aria-expanded', 'false');
      openTool.focus();
      return;
    }
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
 * Moves a link that ends the promo banner copy into its own paragraph, so it can
 * sit at the far end of the bar (as on the source) rather than inline.
 * @param {Element} banner The promo banner section
 */
function decorateBanner(banner) {
  const paragraphs = banner.querySelectorAll('p');
  const p = paragraphs[paragraphs.length - 1];
  if (!p) return;
  const last = p.lastElementChild;
  if (!last) return;
  // the link itself, or a <strong>/<em> that wraps only the link
  const link = last.matches('a[href]') ? last : last.querySelector(':scope > a[href]');
  if (!link || last.textContent.trim() !== link.textContent.trim()) return;
  // only split when the link really ends the paragraph and isn't its only content
  const isBlankText = (node) => node?.nodeType === Node.TEXT_NODE && !node.textContent.trim();
  let next = last.nextSibling;
  while (isBlankText(next)) next = next.nextSibling;
  if (next || p.textContent.trim() === link.textContent.trim()) return;

  const cta = document.createElement('p');
  cta.className = 'nav-banner-cta';
  cta.append(last);
  // drop the whitespace that separated the copy from the link
  while (isBlankText(p.lastChild)) p.lastChild.remove();
  const tail = p.lastChild;
  if (tail?.nodeType === Node.TEXT_NODE) tail.textContent = tail.textContent.trimEnd();
  p.after(cta);
}

/**
 * Wraps a bare top-level label (text or a link not already in a <p>, as in a
 * tight authored list) in a <p>, so every item is styled the same way.
 * @param {Element} navSection The top-level nav <li>
 */
function wrapSectionLabel(navSection) {
  const inline = [];
  let node = navSection.firstChild;
  while (node && !(node.nodeType === Node.ELEMENT_NODE
    && /^(P|H\d|UL|OL|DIV)$/.test(node.tagName))) {
    inline.push(node);
    node = node.nextSibling;
  }
  if (!inline.some((n) => n.textContent.trim())) return;
  const p = document.createElement('p');
  navSection.insertBefore(p, inline[0]);
  p.append(...inline);
}

/**
 * Collapses every open tools dropdown (language / login).
 * @param {Element} nav The nav element
 * @param {Element} [except] A dropdown toggle to leave untouched
 */
function closeToolDropdowns(nav, except = null) {
  nav.querySelectorAll('.nav-tools-toggle[aria-expanded="true"]').forEach((button) => {
    if (button !== except) button.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Turns a tools item with a nested list (e.g. "Language", "Login") into a
 * disclosure: a toggle button (icon for known labels, else the authored text)
 * controlling the nested list, which becomes the dropdown panel.
 * @param {Element} li The tools list item
 * @param {Element} list The nested list
 * @param {number} index Used to build a unique panel id
 */
function decorateToolDropdown(li, list, index) {
  const text = [...li.childNodes]
    .filter((node) => node !== list)
    .map((node) => node.textContent)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return;

  let iconName = '';
  let name = text;
  if (/lang/i.test(text)) {
    iconName = 'globe';
    name = `Change ${text.toLowerCase()}`;
  } else if (/log ?in|account|sign ?in/i.test(text)) {
    iconName = 'user';
    name = `${text} options`;
  }

  list.id = list.id || `nav-tools-panel-${index}`;
  list.classList.add('nav-tools-panel');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-tools-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', list.id);
  // the authored text stays as the (mobile-visible) label; the name adds context
  if (name !== text) button.setAttribute('aria-label', name);
  const label = document.createElement('span');
  label.className = 'nav-tools-label';
  label.textContent = text;
  if (iconName) {
    const icon = document.createElement('span');
    icon.className = `icon icon-${iconName}`;
    button.append(icon);
    decorateIcons(button);
    li.classList.add('nav-tools-icon');
  }
  button.append(label);

  li.classList.add('nav-tools-dropdown');
  li.replaceChildren(button, list);
}

/**
 * Wires the tools dropdowns: click toggles (one open at a time, closing any
 * megamenu), Escape is handled in closeOnEscape, click / focus outside closes.
 * @param {Element} nav The nav element
 * @param {Element} navSections The nav sections, whose megamenus are closed on open
 */
function bindToolDropdowns(nav, navSections) {
  const toggles = nav.querySelectorAll('.nav-tools-toggle');
  if (!toggles.length) return;

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      closeToolDropdowns(nav, button);
      // eslint-disable-next-line no-use-before-define
      if (!expanded && isDesktop.matches) toggleAllNavSections(navSections);
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });

    // on desktop the panel floats, so close it once focus moves elsewhere
    button.parentElement.addEventListener('focusout', (e) => {
      if (isDesktop.matches && e.relatedTarget && !button.parentElement.contains(e.relatedTarget)) {
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!isDesktop.matches) return;
    const open = nav.querySelector('.nav-tools-toggle[aria-expanded="true"]');
    if (open && !open.parentElement.contains(e.target)) open.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Turns the search tool into an icon link, the bold tool into the CTA pill, and
 * items with a nested list into dropdowns.
 * decorateButtons doesn't reach these links because they sit in <li>, not <p>.
 * @param {Element} navTools The tools section
 */
function decorateTools(navTools) {
  if (!navTools) return;
  navTools.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li, i) => {
    const list = li.querySelector(':scope > ul, :scope > ol');
    if (list) {
      decorateToolDropdown(li, list, i);
      return;
    }

    const a = li.querySelector('a[href]');
    if (!a) return;
    const text = a.textContent.trim();
    let path = '';
    try {
      path = new URL(a.href).pathname;
    } catch { /* keep empty */ }

    if (text.toLowerCase() === 'search' || /\/search\/?$/.test(path)) {
      li.classList.add('nav-tools-search');
      // keep the text as the accessible name, visually replaced by the icon
      const label = document.createElement('span');
      label.className = 'nav-tools-label';
      label.textContent = text;
      const icon = document.createElement('span');
      icon.className = 'icon icon-magnifier';
      a.replaceChildren(icon, label);
      decorateIcons(a);
      return;
    }

    const strong = a.closest('strong');
    if (strong && li.contains(strong) && strong.textContent.trim() === text) {
      strong.replaceWith(a);
      a.className = 'button primary';
      li.classList.add('nav-tools-cta');
    }
  });
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
  closeToolDropdowns(nav);
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
    decorateBanner(banner);
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
  // decorateButtons copies the (whitespace-only) text of the image link into its title
  navBrand.querySelectorAll('a[title]').forEach((a) => {
    if (!a.title.trim()) a.removeAttribute('title');
  });

  decorateTools(nav.querySelector('.nav-tools'));

  const navSections = nav.querySelector('.nav-sections');
  bindToolDropdowns(nav, navSections);
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      wrapSectionLabel(navSection);
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
          // open the megamenu flush with the bottom of the nav (the promo banner sits above it)
          block.style.setProperty('--megamenu-top', `${Math.max(0, nav.getBoundingClientRect().bottom)}px`);
          toggleAllNavSections(navSections);
          closeToolDropdowns(nav);
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
