/* eslint-disable */
/* global WebImporter */

/**
 * Import script: the French site header (https://www.solarwinds.com/fr) -> the /fr/nav
 * fragment, picked automatically by the header on every page under /fr/.
 *
 * Authored exactly like /nav (see blocks/header/header.js), one section each:
 *   1 promo banner: the copy, ending with its link
 *   2 brand: the logo, linked to the French home page (/fr)
 *   3 sections: one item per top-level entry. A megamenu item is its label, then
 *       - the rail: h4 title, intro, CTA (<strong> link), "Explore" label (<em>), links
 *       - a group per category: h4 ":nav-xxx: Title" (icon token), optional description,
 *         one list per column (the source lays the links out row by row in an N-column
 *         grid), optional overview link
 *       - the footer bar: h4 "Vous ne savez pas par où commencer ?", its first link as
 *         the CTA (<strong>), then the other links
 *     A direct item (Tarification) is just its link.
 *   4 tools: search link, language list (current language bold), login list, contact
 *     link, quote CTA (<strong>)
 *   5 mobile extras: the links under the source's mobile menu
 *
 * Source DOM (verified against tools/importer/bd-snapshots/www.solarwinds.com/fr.html):
 *   [builder-model="banner"] .builder-block (first of 4 responsive copies) p + a[href]
 *   header (desktop, first) nav[aria-label] img (logo); ul > li (items)
 *     li > button span (label) + panel:
 *       [builder-path$=".leftContent"] p strong (title), p (intro)
 *       [builder-path$=".leftCta"] a (CTA, first of 2 responsive copies)
 *       .tracking-swdc-wide (Explore label), a[data-automation-id$="-explore-link"]
 *       [data-automation-id$="-category-title"] (group title), its sibling
 *         [builder-path$=".categoryDescription"] p, .grid.grid-cols-N > a, [builder-path$=".cta"] a
 *       the group's icon: [builder-path$=".icon"] img (data: SVG)
 *       a[data-automation-id$="-bottom-link"] + its sibling title (footer bar)
 *     li > a (direct item)
 *   nav: button "Login options", a (Nous contacter), [builder-path] a (quote CTA)
 *   header (mobile, second): input[placeholder] (search), ul without buttons (extras)
 *   head link[rel=alternate][hreflang] (the other languages' home pages)
 *
 * The language and login menus are only rendered on click (not in the snapshot); their
 * entries below were read from the live source's menus.
 */

const ORIGIN = 'https://www.solarwinds.com';
const HOME = '/fr';

// the group icons (icons/nav-*.svg), recognised by the start of the source SVG's first path
const ICONS = [
  ['m79.13,26.1', 'nav-observability'],
  ['m83.03,23.54', 'nav-database'],
  ['M66.05,49.92', 'nav-incident-response'],
  ['m82.32,76.25', 'nav-itsm'],
  ['m54,41.16', 'nav-tools'],
  ['m80.92,17.85', 'nav-by-need'],
  ['m68.13,30.85', 'nav-by-technology'],
  ['m89.83,92.65', 'nav-by-industry'],
  ['m93.62,52.35', 'nav-partners'],
  ['m40.32,49.66', 'nav-resource-center'],
  ['m49.92,51.97', 'nav-services-support'],
  ['m63.1,47.03', 'nav-community'],
];

// language menu (live source, /fr): every language but the current one, which is added
// here bold (the header ticks it on mobile and hides it on desktop, as /nav does)
const LANGUAGES = [
  ['en-US', 'us', 'English'],
  ['de-DE', 'de', 'Deutsch'],
  ['es-MX', 'mx', 'Español'],
  ['fr-FR', 'fr', 'Français'],
  ['ja-JP', 'jp', '日本語'],
  ['ko-KR', 'kr', '한국어'],
  ['pt-BR', 'pt', 'Português'],
  ['zh-CN', 'cn', '中文'],
];
const CURRENT_LANGUAGE = 'fr-FR';
// migrated sites: English is the site root, French this folder
const LANGUAGE_HOMES = { 'en-US': '/', 'fr-FR': HOME };

// login menu (live source, /fr: "Login options")
const LOGIN = [
  ['Connexion au portail partenaire', 'https://partner.solarwinds.com/'],
  ['Connexion au portail client', 'https://customerportal.solarwinds.com/'],
];

/** Whitespace collapsed (non-breaking spaces kept: French "commencer ?"). */
function clean(text) {
  return (text || '').replace(/[ \t\r\n]+/g, ' ').trim();
}

/** Absolute source URLs; the (English) blog is migrated, so it stays on this site. */
function url(href) {
  const value = (href || '').trim();
  if (!value || value.startsWith('#')) return value;
  const absolute = new URL(value, ORIGIN).href;
  if (/^https:\/\/www\.solarwinds\.com\/blog\/?$/.test(absolute)) return '/blog';
  return absolute;
}

function el(document, tag, ...children) {
  const node = document.createElement(tag);
  children.filter((c) => c !== null && c !== undefined).forEach((c) => node.append(c));
  return node;
}

function link(document, a, text) {
  const node = document.createElement('a');
  node.href = url(a.getAttribute('href'));
  node.textContent = text === undefined ? clean(a.textContent) : text;
  return node;
}

function list(document, items) {
  const ul = document.createElement('ul');
  items.forEach((item) => ul.append(el(document, 'li', item)));
  return ul;
}

function strongLink(document, a) {
  return el(document, 'p', el(document, 'strong', link(document, a)));
}

function iconToken(img) {
  const src = (img && img.getAttribute('src')) || '';
  if (!src.startsWith('data:image/svg+xml;base64,')) return '';
  let svg = '';
  try {
    svg = atob(src.split(',')[1]);
  } catch (e) {
    return '';
  }
  const d = (svg.match(/ d="([^"]+)"/) || [])[1] || '';
  const match = ICONS.find(([start]) => d.startsWith(start));
  return match ? `:${match[1]}: ` : '';
}

/** The rail: title, intro, CTA, "Explore" label and links. */
function buildRail(document, panel) {
  const nodes = [];
  const left = panel.querySelector('[builder-path$=".leftContent"]');
  const paragraphs = left ? [...left.querySelectorAll('p')].filter((p) => clean(p.textContent)) : [];
  const titleP = paragraphs.find((p) => p.querySelector('strong')) || paragraphs[0];
  if (titleP) nodes.push(el(document, 'h4', clean(titleP.textContent)));
  paragraphs.filter((p) => p !== titleP)
    .forEach((p) => nodes.push(el(document, 'p', clean(p.textContent))));
  const cta = panel.querySelector('[builder-path$=".leftCta"] a[href]');
  if (cta) nodes.push(strongLink(document, cta));
  const label = panel.querySelector('.tracking-swdc-wide');
  if (label && clean(label.textContent)) {
    nodes.push(el(document, 'p', el(document, 'em', clean(label.textContent))));
  }
  const explore = [...panel.querySelectorAll('a[data-automation-id$="-explore-link"]')];
  if (explore.length) nodes.push(list(document, explore.map((a) => link(document, a))));
  return nodes;
}

/**
 * Tags each group title with its icon token, on the loaded page: the importer's own
 * pre-processing (before transform) drops the data: SVG images.
 */
function tagGroupIcons(document) {
  document.querySelectorAll('header nav [data-automation-id$="-category-title"]').forEach((title) => {
    const row = title.parentElement.parentElement;
    const icon = row && row.querySelector('[builder-path$=".icon"] img');
    const token = iconToken(icon);
    if (token) title.setAttribute('data-nav-icon', token);
  });
}

/** A group: icon + title, description, one list per grid column, overview link. */
function buildGroup(document, title) {
  const nodes = [];
  const content = title.parentElement;
  nodes.push(el(document, 'h4', `${title.getAttribute('data-nav-icon') || ''}${clean(title.textContent)}`));

  const desc = content.querySelector('[builder-path$=".categoryDescription"]');
  const descText = desc ? [...desc.querySelectorAll('p')].map((p) => clean(p.textContent)).join(' ').trim() : '';
  if (descText) nodes.push(el(document, 'p', descText));

  const grid = content.querySelector(':scope > .grid');
  const links = grid ? [...grid.querySelectorAll(':scope > a[href]')] : [];
  if (links.length) {
    const cols = parseInt((grid.className.match(/grid-cols-(\d+)/) || [])[1], 10) || 1;
    const columns = Array.from({ length: Math.min(cols, links.length) }, () => []);
    // the grid fills row by row: link i sits in column i % cols
    links.forEach((a, i) => columns[i % cols].push(link(document, a)));
    columns.forEach((column) => nodes.push(list(document, column)));
  }

  const overview = content.querySelector('[builder-path$=".cta"] a[href]');
  if (overview) nodes.push(el(document, 'p', link(document, overview)));
  return nodes;
}

/** The black footer bar: title, first link as the CTA, then the rest. */
function buildFooter(document, panel) {
  const links = [...panel.querySelectorAll('a[data-automation-id$="-bottom-link"]')];
  if (!links.length) return [];
  const title = links[0].parentElement.querySelector(':scope > div');
  const nodes = [el(document, 'h4', clean(title && title.textContent))];
  nodes.push(strongLink(document, links[0]));
  if (links.length > 1) nodes.push(list(document, links.slice(1).map((a) => link(document, a))));
  return nodes;
}

function buildBanner(document) {
  const banner = document.querySelector('[builder-model="banner"] .builder-blocks > .builder-block');
  if (!banner) return null;
  const copy = [...banner.querySelectorAll('p')].find((p) => !p.closest('a') && clean(p.textContent));
  const a = banner.querySelector('a[href]');
  const p = el(document, 'p', clean(copy && copy.textContent));
  if (a) p.append(' ', link(document, a));
  return el(document, 'div', p);
}

function buildBrand(document, nav) {
  const logo = nav.querySelector('img[src*="aprimocdn"], a[href] > img');
  const a = document.createElement('a');
  a.href = HOME;
  if (logo) {
    const img = document.createElement('img');
    img.src = logo.getAttribute('src');
    img.alt = 'SolarWinds';
    a.append(img);
  } else {
    a.textContent = 'SolarWinds';
  }
  return el(document, 'div', el(document, 'p', a));
}

function buildSections(document, nav) {
  const items = nav.querySelector('ul');
  const ul = document.createElement('ul');
  [...(items ? items.children : [])].forEach((item) => {
    const button = item.querySelector(':scope > div > button, :scope > button');
    const direct = item.querySelector(':scope a[href]');
    const li = document.createElement('li');
    if (button) {
      const panel = button.nextElementSibling;
      li.append(el(document, 'p', clean(button.textContent)));
      if (panel) {
        li.append(...buildRail(document, panel));
        panel.querySelectorAll('[data-automation-id$="-category-title"]')
          .forEach((title) => li.append(...buildGroup(document, title)));
        li.append(...buildFooter(document, panel));
      }
    } else if (direct) {
      li.append(el(document, 'p', link(document, direct)));
    } else {
      return;
    }
    ul.append(li);
  });
  return el(document, 'div', ul);
}

function buildTools(document, nav, mobileHeader) {
  const items = [];

  // search: submits to the site search (the source's French search uses the same page)
  const input = mobileHeader && mobileHeader.querySelector('input[placeholder]');
  const searchLabel = clean(input && input.getAttribute('placeholder')).replace(/\.+$/, '') || 'Search';
  const search = document.createElement('a');
  search.href = `${ORIGIN}/internalsearch/search`;
  search.textContent = searchLabel;
  items.push(search);

  // languages: the source's alternates (hreflang) are the other languages' home pages
  const alternates = {};
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => {
    alternates[l.getAttribute('hreflang')] = l.getAttribute('href');
  });
  const languages = LANGUAGES.map(([code, flag, name]) => {
    const a = document.createElement('a');
    a.href = LANGUAGE_HOMES[code] || alternates[code] || `${ORIGIN}/${code.slice(0, 2)}`;
    a.textContent = `:flag-${flag}: ${name}`;
    return code === CURRENT_LANGUAGE ? el(document, 'strong', a) : a;
  });
  // "Language": the header's globe toggle; the mobile sheet reads "Select a Language", as on the source
  // (labels stay bare text, so the tools list stays a tight list, as in /nav)
  items.push(['Language', list(document, languages)]);

  // login options
  const loginButton = nav.querySelector('button[aria-label$=" options"]');
  const loginLabel = clean(loginButton && loginButton.getAttribute('aria-label')).replace(/ options$/, '') || 'Login';
  items.push([loginLabel, list(document, LOGIN.map(([text, href]) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
  }))]);

  // contact link, then the quote CTA (a builder button)
  const menu = nav.querySelector('ul');
  const after = [...nav.querySelectorAll('a[href]')].filter((a) => menu
    && (menu.compareDocumentPosition(a) & 4) && !menu.contains(a));
  const cta = after.find((a) => /button-primary/.test(a.className)) || after[after.length - 1];
  after.filter((a) => a !== cta && clean(a.textContent))
    .forEach((a) => items.push(link(document, a)));
  if (cta) items.push(el(document, 'strong', link(document, cta)));

  const ul = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    if (Array.isArray(item)) li.append(...item);
    else li.append(item);
    ul.append(li);
  });
  return el(document, 'div', ul);
}

function buildMobileExtra(document, mobileHeader) {
  const lists = mobileHeader ? [...mobileHeader.querySelectorAll('ul')] : [];
  const extra = lists.find((ul) => !ul.querySelector('button') && ul.querySelector('a[href]'));
  if (!extra) return null;
  return el(document, 'div', list(document, [...extra.querySelectorAll('a[href]')]
    .map((a) => link(document, a))));
}

export default {
  onLoad: async ({ document }) => tagGroupIcons(document),

  transform: (payload) => {
    const { document, url: pageUrl, params } = payload;
    const headers = [...document.querySelectorAll('header')];
    const nav = headers[0] && headers[0].querySelector('nav');
    if (!nav) throw new Error('French site header (header nav) not found');
    const mobileHeader = headers[1] || null;

    const sections = [
      buildBanner(document),
      buildBrand(document, nav),
      buildSections(document, nav),
      buildTools(document, nav, mobileHeader),
      buildMobileExtra(document, mobileHeader),
    ].filter(Boolean);

    const root = document.createElement('div');
    sections.forEach((section, i) => {
      if (i > 0) root.append(document.createElement('hr'));
      root.append(...section.childNodes);
    });

    WebImporter.rules.adjustImageUrls(root, pageUrl, params.originalURL);

    document.body.replaceChildren(root);
    return [{
      element: document.body,
      path: '/fr/nav',
      report: {
        title: 'French nav',
        template: 'nav-fr',
        sections: sections.length,
        items: root.querySelectorAll(':scope > ul > li').length,
      },
    }];
  },
};
