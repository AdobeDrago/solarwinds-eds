import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width (the source's mobile menu runs up to 1023px)
const isDesktop = window.matchMedia('(min-width: 1024px)');

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
 * Copies a link for the mobile menu, without its desktop decoration.
 * @param {Element} a The link
 * @returns {Element} A list item holding the copied link
 */
function mobileLinkItem(a) {
  const copy = a.cloneNode(true);
  copy.removeAttribute('class');
  copy.removeAttribute('title');
  const li = document.createElement('li');
  li.append(copy);
  return li;
}

/**
 * Creates a mobile menu button that opens another level.
 * @param {string} className The button class
 * @param {string} label The button text
 * @param {string} target The level to open
 * @returns {Element} The button
 */
function mobileLevelButton(className, label, target) {
  const button = createEl('button', className);
  button.type = 'button';
  button.dataset.target = target;
  button.textContent = label;
  return button;
}

/**
 * Builds the mobile / tablet drill-down menu from the decorated nav, as on the
 * source: a main level (search, the top-level items, extra links), a level per
 * megamenu item (its groups, CTA and "Explore" / footer links) and a level per
 * group (its links in reading order, overview link and CTA).
 * @param {Element} nav The decorated nav (megamenus already built)
 * @returns {Element} The .nav-mobile element
 */
function buildMobileMenu(nav) {
  const menu = createEl('div', 'nav-mobile');
  const levels = [];
  const addLevel = (id) => {
    const level = createEl('div', 'nav-mobile-level');
    level.dataset.level = id;
    level.hidden = levels.length > 0;
    levels.push(level);
    menu.append(level);
    return level;
  };

  const main = addLevel('main');
  const mainPanel = createEl('div', 'nav-mobile-main');
  main.append(mainPanel);

  // search box, submitting to the authored search link
  const search = nav.querySelector('.nav-tools-search a[href]');
  if (search) {
    const form = createEl('form', 'nav-mobile-search');
    form.action = search.href;
    form.method = 'get';
    form.setAttribute('role', 'search');
    const submit = createEl('button', 'nav-mobile-search-submit');
    submit.type = 'submit';
    submit.setAttribute('aria-label', search.textContent.trim() || 'Search');
    submit.innerHTML = '<span class="icon icon-nav-search"></span>';
    const input = createEl('input', 'nav-mobile-search-input');
    input.type = 'search';
    input.name = 'q';
    input.placeholder = 'Search...';
    input.setAttribute('aria-label', search.textContent.trim() || 'Search');
    form.append(submit, input);
    mainPanel.append(form);
    decorateIcons(form);
  }

  const primary = createEl('ul', 'nav-mobile-list nav-mobile-primary');
  mainPanel.append(primary);
  nav.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((item, i) => {
    const label = item.querySelector(':scope > p')?.textContent.trim();
    const megamenu = item.querySelector(':scope > .nav-megamenu');
    if (!megamenu || !label) {
      const a = item.querySelector(':scope > p a[href]');
      if (a) primary.append(mobileLinkItem(a));
      return;
    }
    const sectionId = `s${i}`;
    const li = document.createElement('li');
    li.append(mobileLevelButton('nav-mobile-next', label, sectionId));
    primary.append(li);

    // links shown under every level of this item: the rail's "Explore" links, then the footer's
    const tailLinks = () => {
      const list = createEl('ul', 'nav-mobile-list nav-mobile-links');
      megamenu.querySelectorAll('.megamenu-rail-links a[href], .megamenu-footer-links a[href]')
        .forEach((a) => list.append(mobileLinkItem(a)));
      return list;
    };
    const cta = () => {
      const p = createEl('p', 'nav-mobile-cta');
      const a = megamenu.querySelector('.megamenu-rail a.button');
      if (a) p.append(mobileLinkItem(a).firstElementChild);
      return p;
    };
    const titled = (text) => {
      const panel = createEl('div', 'nav-mobile-panel');
      const title = createEl('p', 'nav-mobile-title');
      title.textContent = text;
      panel.append(title);
      return panel;
    };

    const section = addLevel(sectionId);
    section.append(mobileLevelButton('nav-mobile-back', 'Back to Main Menu', 'main'));
    const sectionPanel = titled(label);
    const groups = createEl('ul', 'nav-mobile-list nav-mobile-groups');
    sectionPanel.append(groups);

    megamenu.querySelectorAll('.megamenu-group').forEach((group, j) => {
      const groupTitle = group.querySelector('.megamenu-group-title')?.textContent.trim();
      if (!groupTitle) return;
      const groupId = `${sectionId}g${j}`;
      const gli = document.createElement('li');
      gli.append(mobileLevelButton('nav-mobile-next', groupTitle, groupId));
      groups.append(gli);

      const level = addLevel(groupId);
      level.append(mobileLevelButton('nav-mobile-back', `Back to ${label}`, sectionId));
      const panel = titled(groupTitle);
      // one list, read across the desktop columns row by row (as the source's mobile menu)
      const links = createEl('ul', 'nav-mobile-list nav-mobile-group-links');
      const columns = [...group.querySelectorAll('.megamenu-group-links ul')]
        .map((ul) => [...ul.querySelectorAll('a[href]')]);
      const rows = Math.max(0, ...columns.map((column) => column.length));
      for (let row = 0; row < rows; row += 1) {
        columns.forEach((column) => {
          if (column[row]) links.append(mobileLinkItem(column[row]));
        });
      }
      const overview = createEl('p', 'nav-mobile-overview');
      const overviewLink = group.querySelector('.megamenu-group-overview a[href]');
      if (overviewLink) overview.append(mobileLinkItem(overviewLink).firstElementChild);
      panel.append(links, overview, cta());
      level.append(panel, tailLinks());
    });

    sectionPanel.append(cta());
    section.append(sectionPanel, tailLinks());
  });

  const extra = nav.querySelector('.nav-mobile-extra');
  if (extra) {
    const secondary = createEl('ul', 'nav-mobile-list nav-mobile-secondary');
    extra.querySelectorAll('a[href]').forEach((a) => secondary.append(mobileLinkItem(a)));
    main.append(secondary);
  }

  // level navigation: show the target level, from its top, and focus its first control
  menu.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-target]');
    if (!button) return;
    levels.forEach((level) => { level.hidden = level.dataset.level !== button.dataset.target; });
    nav.classList.toggle('nav-mobile-sub', button.dataset.target !== 'main');
    nav.scrollTop = 0;
    const target = levels.find((level) => !level.hidden);
    target?.querySelector('button, a[href], input')?.focus();
  });
  return menu;
}

/**
 * Returns the mobile menu to its main level.
 * @param {Element} nav The nav
 */
function resetMobileMenu(nav) {
  nav.querySelectorAll('.nav-mobile-level').forEach((level, i) => { level.hidden = i > 0; });
  nav.classList.remove('nav-mobile-sub');
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
  // a bold entry is the current choice (e.g. English): ticked on mobile, hidden on desktop
  list.querySelectorAll(':scope > li').forEach((item) => {
    const current = item.querySelector('strong a[href]');
    if (!current) return;
    item.classList.add('nav-tools-current');
    current.setAttribute('aria-current', 'true');
  });
  // the mobile menu shows the list as a titled sheet ("Select a Language")
  const title = createEl('li', 'nav-tools-panel-title');
  title.setAttribute('aria-hidden', 'true');
  title.textContent = `Select a ${text}`;
  list.prepend(title);

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
  if (!expanded && !isDesktop.matches) {
    // the open menu covers the viewport below whatever of the promo banner is in view
    const header = nav.closest('.header');
    const banner = header?.querySelector('.nav-banner');
    header?.style.setProperty('--nav-open-top', `${Math.max(0, banner?.getBoundingClientRect().bottom || 0)}px`);
    resetMobileMenu(nav);
  }
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

/*
 * Blog header (pages with the "blog" template, e.g. /blog), values extracted from
 * the source's .orangematter-header: a dark bar with the blog logo, dropdowns of
 * category links (icon + link), direct links and an inline search; below 993px a
 * hamburger opens a full-screen menu with a search form and expanding submenus.
 * It is built from its own nav fragment (/blog/nav: brand, sections, tools) and
 * shares none of the main header's DOM, listeners or styles.
 */

// the source's blog header switches to its mobile menu at 992px and below
const isBlogDesktop = window.matchMedia('(min-width: 993px)');

const BLOG_ICONS = {
  chevron: '<svg class="blog-nav-chevron" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M12 7.429 6 .57 0 7.429h12z"/></svg>',
  search: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><circle cx="14.095" cy="14.095" r="6.095" stroke="currentColor" stroke-width="2"/><path d="m24 24-5.333-5.333" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="m10.293 9.707 12 12M10.293 21.707l12-12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  menu: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="6" y="6" width="20" height="4" rx="2"/><rect x="6" y="14" width="20" height="4" rx="2"/><rect x="6" y="22" width="20" height="4" rx="2"/></svg>',
};

/**
 * Creates a button.
 * @param {string} className The class name
 * @param {string} [type] The button type
 * @returns {Element} The button
 */
function blogButton(className, type = 'button') {
  const button = createEl('button', className);
  button.type = type;
  return button;
}

/**
 * Reads the authored top-level items: a label with a nested list of (icon +) links
 * is a dropdown; an item holding just a link is a direct link.
 * @param {Element} section The nav sections section
 * @returns {Array<Object>} Items ({ label, links: [{ a, icon }] } or { a })
 */
function readBlogNavItems(section) {
  const items = [];
  section?.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
    const sub = li.querySelector(':scope > ul, :scope > ol');
    if (sub) {
      const label = [...li.childNodes]
        .filter((node) => node !== sub)
        .map((node) => node.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      const links = [...sub.querySelectorAll(':scope > li')].map((entry) => ({
        a: entry.querySelector('a[href]'),
        icon: entry.querySelector('picture') || entry.querySelector('img'),
      })).filter(({ a }) => a);
      if (label && links.length) items.push({ label, links });
      return;
    }
    const a = li.querySelector('a[href]');
    if (a) items.push({ a });
  });
  return items;
}

/**
 * Copies an authored link (without the title decorateButtons adds).
 * @param {Element} a The link
 * @param {string} className The class name
 * @returns {Element} The link
 */
function blogLink(a, className) {
  const link = createEl('a', className);
  link.href = a.href;
  link.textContent = a.textContent.trim();
  return link;
}

/**
 * Builds a list of category links, each after its icon.
 * @param {Array<Object>} links The links ({ a, icon })
 * @param {string} prefix The class prefix (desktop panel or mobile submenu)
 * @param {string} id The list id
 * @returns {Element} The list
 */
function blogLinkList(links, prefix, id) {
  const list = createEl('ul', prefix);
  list.id = id;
  links.forEach(({ a, icon }) => {
    const li = createEl('li', `${prefix}-item`);
    if (icon) {
      const copy = icon.cloneNode(true);
      copy.classList.add(`${prefix}-icon`);
      copy.querySelectorAll('img').forEach((img) => { img.alt = ''; });
      if (copy.tagName === 'IMG') copy.alt = '';
      li.append(copy, ' ');
    }
    li.append(blogLink(a, `${prefix}-link`));
    list.append(li);
  });
  return list;
}

/**
 * Builds a search form submitting to the authored search link (its first query
 * parameter names the field, e.g. /blog/search?term=).
 * @param {Element} link The search link
 * @param {string} prefix The class prefix
 * @returns {Element} The form
 */
function blogSearchForm(link, prefix) {
  const url = new URL(link.href);
  const name = [...url.searchParams.keys()][0] || 'term';
  url.search = '';
  const label = link.textContent.trim() || 'Search';

  const form = createEl('form', `${prefix}-form`);
  form.action = url.href;
  form.method = 'get';
  form.setAttribute('role', 'search');
  const input = createEl('input', `${prefix}-input`);
  input.type = 'text';
  input.name = name;
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  const submit = blogButton(`${prefix}-submit`, 'submit');
  submit.setAttribute('aria-label', label);
  submit.innerHTML = BLOG_ICONS.search;
  form.append(input, submit);
  // an empty query goes nowhere
  form.addEventListener('submit', (e) => {
    if (input.value.trim()) return;
    e.preventDefault();
    input.focus();
  });
  return form;
}

/**
 * Decorates the blog header from the /blog/nav fragment.
 * @param {Element} block The header block element
 * @param {Element} fragment The loaded nav fragment
 */
function decorateBlogHeader(block, fragment) {
  const [brandSection, itemsSection, toolsSection] = fragment.children;
  block.classList.add('header-blog');

  const navWrapper = createEl('div', 'blog-nav-wrapper');
  const nav = createEl('nav', 'blog-nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  const bar = createEl('div', 'blog-nav-bar');

  // brand: the blog logo (desktop) and the flame mark (mobile / tablet), one link
  const brand = createEl('div', 'blog-nav-brand');
  const home = createEl('a', 'blog-nav-home');
  home.href = brandSection?.querySelector('a[href]')?.href || '/blog';
  const [logo, mark = logo] = brandSection?.querySelectorAll('img') || [];
  [logo, mark].filter(Boolean).forEach((img, i) => {
    const picture = (img.closest('picture') || img).cloneNode(true);
    picture.classList.add(i ? 'blog-nav-logo-mobile' : 'blog-nav-logo');
    picture.querySelectorAll('img').forEach((el) => { el.loading = 'eager'; });
    if (picture.tagName === 'IMG') picture.loading = 'eager';
    home.append(picture);
  });
  if (!logo) home.textContent = 'SolarWinds Blog';
  brand.append(home);

  // desktop menu: dropdown buttons, direct links, then the search toggle
  const menu = createEl('ul', 'blog-nav-menu');
  const items = readBlogNavItems(itemsSection);
  items.forEach((item, i) => {
    const li = createEl('li', 'blog-nav-item');
    if (item.links) {
      li.classList.add('blog-nav-drop');
      const button = blogButton('blog-nav-link');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `blog-nav-panel-${i}`);
      // the label keeps its trailing space before the chevron, as on the source
      button.append(`${item.label} `);
      button.insertAdjacentHTML('beforeend', BLOG_ICONS.chevron);
      const popup = createEl('div', 'blog-nav-popup');
      popup.append(blogLinkList(item.links, 'blog-nav-panel', `blog-nav-panel-${i}`));
      li.append(button, popup);
    } else {
      li.append(blogLink(item.a, 'blog-nav-link'));
    }
    menu.append(li);
  });

  const searchLink = toolsSection?.querySelector('a[href]');
  let search = null;
  if (searchLink) {
    search = createEl('li', 'blog-nav-search');
    const toggle = blogButton('blog-nav-search-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'blog-nav-search-box');
    toggle.setAttribute('aria-label', searchLink.textContent.trim() || 'Search');
    toggle.innerHTML = BLOG_ICONS.search;
    const box = createEl('div', 'blog-nav-search-box');
    box.id = 'blog-nav-search-box';
    const form = blogSearchForm(searchLink, 'blog-nav-search');
    const close = blogButton('blog-nav-search-close');
    close.setAttribute('aria-label', 'Close search');
    close.innerHTML = BLOG_ICONS.close;
    form.append(close);
    box.append(form);
    search.append(toggle, box);
    menu.append(search);
  }

  // mobile / tablet: hamburger, then a full-screen menu (search form, expanding items)
  const hamburger = blogButton('blog-nav-hamburger');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-controls', 'blog-nav-mobile');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.innerHTML = `<span class="blog-nav-hamburger-open">${BLOG_ICONS.menu}</span><span class="blog-nav-hamburger-close">${BLOG_ICONS.close}</span>`;

  const mobile = createEl('div', 'blog-nav-mobile');
  mobile.id = 'blog-nav-mobile';
  mobile.hidden = true;
  if (searchLink) {
    const searchWrap = createEl('div', 'blog-nav-mobile-search');
    searchWrap.append(blogSearchForm(searchLink, 'blog-nav-mobile-search'));
    mobile.append(searchWrap);
  }
  const mobileList = createEl('ul', 'blog-nav-mobile-list');
  items.forEach((item, i) => {
    const li = createEl('li', 'blog-nav-mobile-item');
    if (item.links) {
      const button = blogButton('blog-nav-mobile-link');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `blog-nav-mobile-sub-${i}`);
      button.append(item.label);
      button.insertAdjacentHTML('beforeend', BLOG_ICONS.chevron);
      const sub = blogLinkList(item.links, 'blog-nav-mobile-sub', `blog-nav-mobile-sub-${i}`);
      sub.hidden = true;
      li.append(button, sub);
    } else {
      li.append(blogLink(item.a, 'blog-nav-mobile-link'));
    }
    mobileList.append(li);
  });
  mobile.append(mobileList);

  bar.append(brand, menu, hamburger);
  nav.append(bar, mobile);

  // state
  const drops = [...menu.querySelectorAll('.blog-nav-drop > .blog-nav-link')];
  const searchToggle = search?.querySelector('.blog-nav-search-toggle');
  const closeDrops = (except = null) => {
    drops.forEach((button) => {
      if (button !== except) button.setAttribute('aria-expanded', 'false');
    });
    block.classList.toggle('blog-nav-popup-open', drops.some((b) => b.getAttribute('aria-expanded') === 'true'));
  };
  const closeSearch = () => {
    if (!search || !search.classList.contains('active')) return;
    search.classList.remove('active');
    searchToggle.setAttribute('aria-expanded', 'false');
  };
  const isMenuOpen = () => hamburger.getAttribute('aria-expanded') === 'true';
  const toggleMobileMenu = (open) => {
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobile.hidden = !open;
    block.classList.toggle('blog-nav-mobile-open', open);
    document.body.style.overflowY = open ? 'hidden' : '';
    if (open) navWrapper.scrollTop = 0;
  };

  drops.forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeSearch();
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      closeDrops(button);
    });
    // tabbing out of an open dropdown closes it
    button.parentElement.addEventListener('focusout', (e) => {
      if (e.relatedTarget && !button.parentElement.contains(e.relatedTarget)) {
        button.setAttribute('aria-expanded', 'false');
        closeDrops(button);
      }
    });
  });

  if (search) {
    const input = search.querySelector('.blog-nav-search-input');
    searchToggle.addEventListener('click', () => {
      closeDrops();
      search.classList.add('active');
      searchToggle.setAttribute('aria-expanded', 'true');
      input.focus();
    });
    search.querySelector('.blog-nav-search-close').addEventListener('click', () => {
      closeSearch();
      searchToggle.focus();
    });
    search.addEventListener('focusout', (e) => {
      if (e.relatedTarget && !search.contains(e.relatedTarget)) closeSearch();
    });
  }

  hamburger.addEventListener('click', () => toggleMobileMenu(!isMenuOpen()));

  // mobile items expand one at a time
  const mobileDrops = [...mobileList.querySelectorAll('button.blog-nav-mobile-link')];
  mobileDrops.forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      mobileDrops.forEach((other) => {
        const expanded = other === button && open;
        other.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        other.nextElementSibling.hidden = !expanded;
      });
    });
  });

  // a click outside the open dropdown / search closes it
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.blog-nav-drop')) closeDrops();
    if (search && !search.contains(e.target)) closeSearch();
  });

  // Escape closes the innermost open layer and returns focus to its control
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const openDrop = drops.find((b) => b.getAttribute('aria-expanded') === 'true');
    if (openDrop) {
      closeDrops();
      openDrop.focus();
    } else if (search?.classList.contains('active')) {
      closeSearch();
      searchToggle.focus();
    } else if (isMenuOpen()) {
      toggleMobileMenu(false);
      hamburger.focus();
    }
  });

  // crossing the breakpoint resets every open layer
  isBlogDesktop.addEventListener('change', () => {
    closeDrops();
    closeSearch();
    toggleMobileMenu(false);
  });

  navWrapper.append(nav);
  block.append(navWrapper);
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

  // blog pages (template "blog") get the blog header, built from their own nav
  if (document.body.classList.contains('blog')) {
    if (fragment) decorateBlogHeader(block, fragment);
    return;
  }

  // optional promo banner: an extra leading section, told apart from the brand by having no logo
  let banner = null;
  const [first, second] = fragment.children;
  if (second && !first.querySelector('img') && second.querySelector('img')) {
    banner = first;
    banner.remove();
    banner.classList.add('nav-banner');
    decorateBanner(banner);
  }

  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // brand, sections and tools, then optional extra links for the mobile menu
  const classes = ['brand', 'sections', 'tools', 'mobile-extra'];
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
  // the open mobile menu shows only the SolarWinds mark
  const homeLink = navBrand.querySelector('a');
  if (homeLink) {
    homeLink.append(createEl('span', 'icon icon-sw-mark'));
    decorateIcons(homeLink);
  }

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

  nav.append(buildMobileMenu(nav));

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
