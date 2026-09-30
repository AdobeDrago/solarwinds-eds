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
    const sections = focused.closest('.nav-sections');
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(sections);
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
    // eslint-disable-next-line no-use-before-define
    syncMegaMenuState(sections);
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Creates an element with a class name.
 * @param {string} tag The tag name
 * @param {string} className The class name
 * @returns {Element} The element
 */
function createEl(tag, className) {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

/**
 * Whether a paragraph holds nothing but a single link.
 * @param {Element} p The paragraph
 * @returns {boolean} True for a sole-link paragraph
 */
function isSoleLink(p) {
  const a = p.querySelector('a');
  return !!a && p.textContent.trim() === a.textContent.trim();
}

/**
 * Builds the teal rail: headline, intro, CTA pill, "Explore" label and links.
 * @param {Object} seg The segment ({ heading, nodes }) that starts the megamenu
 * @returns {Element} The rail
 */
function buildMegaMenuRail(seg) {
  const rail = createEl('div', 'megamenu-rail');
  const title = createEl('p', 'megamenu-rail-title');
  title.textContent = seg.heading.textContent.trim();
  rail.append(title);
  seg.nodes.forEach((node) => {
    if (node.tagName === 'UL') {
      node.classList.add('megamenu-rail-links');
    } else if (node.tagName === 'P' && !node.classList.contains('button-wrapper')) {
      // decorateButtons (run earlier, in decorateMain) already turned the
      // <strong><a></strong> CTA into <p class="button-wrapper"><a class="button">
      node.classList.add(node.querySelector('em') ? 'megamenu-rail-label' : 'megamenu-rail-intro');
    }
    rail.append(node);
  });
  return rail;
}

/**
 * Builds a group: icon, title, optional description, link columns and an
 * optional overview link. Each authored list is one column; the columns are
 * laid out as a row-aligned grid, as on the source.
 * @param {Object} seg The segment ({ heading, nodes }) for the group
 * @returns {Element} The group
 */
function buildMegaMenuGroup(seg) {
  const group = createEl('div', 'megamenu-group');
  const icon = seg.heading.querySelector('.icon');
  if (icon) {
    icon.classList.add('megamenu-group-icon');
    group.append(icon);
  }
  const content = createEl('div', 'megamenu-group-content');
  const title = createEl('p', 'megamenu-group-title');
  title.textContent = seg.heading.textContent.trim();
  content.append(title);

  const lists = seg.nodes.filter((node) => node.tagName === 'UL');
  let links = null;
  if (lists.length) {
    links = createEl('div', 'megamenu-group-links');
    links.style.setProperty('--megamenu-cols', lists.length);
    lists.forEach((ul, col) => {
      // the columns share the grid, so each list stays a list for assistive tech
      ul.setAttribute('role', 'list');
      [...ul.children].forEach((li, row) => {
        li.style.gridArea = `${row + 1} / ${col + 1}`;
      });
      links.append(ul);
    });
  }

  let linksPlaced = false;
  seg.nodes.forEach((node) => {
    if (node.tagName === 'UL') {
      if (!linksPlaced) content.append(links);
      linksPlaced = true;
    } else if (node.tagName === 'P') {
      if (isSoleLink(node)) node.className = 'megamenu-group-overview';
      else node.classList.add('megamenu-group-desc');
      content.append(node);
    }
  });
  group.append(content);
  return group;
}

/**
 * Builds the black footer bar: a title followed by a single row of links.
 * @param {Object} seg The "Not sure where to start?" segment
 * @returns {Element} The footer bar
 */
function buildMegaMenuFooter(seg) {
  const footer = createEl('div', 'megamenu-footer');
  const title = createEl('p', 'megamenu-footer-title');
  title.textContent = seg.heading.textContent.trim();
  const list = createEl('ul', 'megamenu-footer-links');
  seg.nodes.forEach((node) => {
    if (node.tagName === 'UL') {
      list.append(...node.children);
    } else {
      // the authored CTA reads as a plain link here, like the other footer links
      node.querySelectorAll('a').forEach((a) => {
        a.removeAttribute('class');
        const li = document.createElement('li');
        li.append(a);
        list.append(li);
      });
    }
    node.remove();
  });
  footer.append(title, list);
  return footer;
}

/**
 * Rebuilds a flat, heading-delimited authored megamenu (h4 + p/ul siblings,
 * as authored content survives DA's markdown round-trip) into the card DOM:
 * a rail and the groups side by side, over a footer bar.
 * The first h4 starts the rail; a last h4 "Not sure where to start?" starts the
 * footer; every other h4 starts a group (an icon token in it becomes its icon).
 * @param {Element} navSection The <li> nav item, possibly containing h4s
 * @returns {Element|null} The built .nav-megamenu element, or null if none
 */
function buildMegaMenu(navSection) {
  // split the item's children into segments, one per h4
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

  const megamenu = createEl('div', 'nav-megamenu');
  const body = createEl('div', 'megamenu-body');
  const groups = createEl('div', 'megamenu-groups');
  let footer = null;

  segments.forEach((seg, i) => {
    const isFooter = i > 0 && i === segments.length - 1
      && /^not sure where to start/i.test(seg.heading.textContent.trim());
    if (i === 0) body.append(buildMegaMenuRail(seg));
    else if (isFooter) footer = buildMegaMenuFooter(seg);
    else groups.append(buildMegaMenuGroup(seg));
    seg.heading.remove();
  });

  if (groups.children.length) body.append(groups);
  megamenu.append(body);
  if (footer) megamenu.append(footer);
  return megamenu;
}

/**
 * Marks the header while a desktop megamenu is open, for the page backdrop.
 * @param {Element} sections The nav sections
 */
function syncMegaMenuState(sections) {
  const header = sections?.closest('.header');
  if (!header) return;
  const open = isDesktop.matches
    && !!sections.querySelector('.nav-drop[aria-expanded="true"] .nav-megamenu');
  header.classList.toggle('megamenu-open', open);
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
    } else if (a.classList.contains('button')) {
      // decorateButtons already turned <p><strong><a></strong></p> into a button
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
  syncMegaMenuState(sections);
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
      navSection.addEventListener('click', (e) => {
        // clicks within the open card (its links, gaps) never toggle it
        if (e.target.closest('.nav-megamenu')) return;
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          // open the megamenu flush with the bottom of the nav (the promo banner sits above it)
          block.style.setProperty('--megamenu-top', `${Math.max(0, nav.getBoundingClientRect().bottom)}px`);
          toggleAllNavSections(navSections);
          closeToolDropdowns(nav);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          syncMegaMenuState(navSections);
        }
      });
    });

    // a click anywhere outside the open item (e.g. on the backdrop) closes it
    document.addEventListener('click', (e) => {
      if (!isDesktop.matches) return;
      const open = navSections.querySelector('.nav-drop[aria-expanded="true"]');
      if (open && !open.contains(e.target)) toggleAllNavSections(navSections);
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
