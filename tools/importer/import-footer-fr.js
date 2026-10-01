/* eslint-disable */
/* global WebImporter */

/**
 * Import script: the French site footer (https://www.solarwinds.com/fr) -> the
 * /fr/footer fragment, picked automatically by the footer on every page under /fr/.
 *
 * Authored exactly like /footer (blocks/footer/footer.js classifies the sections by
 * content), one section each:
 *   1 brand: the SolarWinds logo, then the "about" paragraph
 *   2-6 columns: a heading, then the list of links
 *   7 social: a (visually hidden) heading, the social links named by network (rendered
 *     as icons), then the CTA as a bold link
 *   8 legal: the list of legal links; the cookie-settings button stays plain text
 *   9 copyright: the copyright line
 * Links are absolute to www.solarwinds.com, except the (English) blog, which is
 * migrated: the source links it from the French footer too.
 *
 * Source DOM (verified against tools/importer/bd-snapshots/www.solarwinds.com/fr.html):
 *   footer (first): img (logo), .builder-text p (about), span + ul > li > a (columns),
 *     ul > li > a[aria-label] (social, data: svg icons), .builder-blocks a (CTA)
 *   footer (second): ul > li > a | button (legal), p (copyright)
 */

const ORIGIN = 'https://www.solarwinds.com';

const SOCIAL = [
  ['Facebook', /facebook\.com/],
  ['Instagram', /instagram\.com/],
  ['Twitter', /(twitter|x)\.com/],
  ['YouTube', /youtube\.com|youtu\.be/],
  ['LinkedIn', /linkedin\.com/],
];

// the social links' heading (visually hidden; the source shows none)
const SOCIAL_HEADING = 'Suivez-nous';

function clean(text) {
  return (text || '').replace(/[ \t\r\n]+/g, ' ').trim();
}

/** An element's visible text (the source inlines <style> elements in its blocks). */
function textOf(node) {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('style, script').forEach((s) => s.remove());
  return clean(copy.textContent);
}

function url(href) {
  const value = (href || '').trim();
  const absolute = new URL(value, ORIGIN).href;
  if (/^https:\/\/www\.solarwinds\.com\/blog\/?$/.test(absolute)) return '/blog';
  return absolute;
}

function link(document, href, text) {
  const a = document.createElement('a');
  a.href = url(href);
  a.textContent = text;
  return a;
}

function list(document, items) {
  const ul = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.append(item);
    ul.append(li);
  });
  return ul;
}

function section(document, ...children) {
  const div = document.createElement('div');
  div.append(...children.filter(Boolean));
  return div;
}

const isSocial = (ul) => {
  const links = [...ul.querySelectorAll('a[href]')];
  return links.length && links.every((a) => SOCIAL.some(([, re]) => re.test(a.getAttribute('href'))));
};

export default {
  transform: (payload) => {
    const { document, url: pageUrl, params } = payload;
    const [main, bottom = main] = document.querySelectorAll('footer');
    if (!main) throw new Error('French site footer (footer) not found');

    const sections = [];

    // brand: logo + about paragraph
    const brand = [];
    const logo = main.querySelector('img:not([src^="data:"])');
    if (logo) {
      const p = document.createElement('p');
      const img = document.createElement('img');
      img.src = logo.getAttribute('src');
      img.alt = 'SolarWinds';
      p.append(img);
      brand.push(p);
    }
    const about = [...main.querySelectorAll('.builder-text p')].find((p) => textOf(p));
    if (about) {
      const p = document.createElement('p');
      p.textContent = textOf(about);
      brand.push(p);
    }
    if (brand.length) sections.push(section(document, ...brand));

    // link columns: the label before each list is its heading
    const lists = [...main.querySelectorAll('ul')];
    lists.filter((ul) => !isSocial(ul)).forEach((ul) => {
      const label = ul.previousElementSibling;
      const links = [...ul.querySelectorAll(':scope > li > a[href]')];
      if (!label || !clean(label.textContent) || !links.length) return;
      const h4 = document.createElement('h4');
      h4.textContent = clean(label.textContent);
      sections.push(section(document, h4, list(document, links
        .map((a) => link(document, a.getAttribute('href'), clean(a.textContent))))));
    });

    // social links (named by network) + the CTA after them
    const social = lists.find(isSocial);
    if (social) {
      const h4 = document.createElement('h4');
      h4.textContent = SOCIAL_HEADING;
      const links = [...social.querySelectorAll('a[href]')].map((a) => {
        const href = a.getAttribute('href');
        const match = SOCIAL.find(([, re]) => re.test(href));
        return link(document, href, match ? match[0] : clean(a.getAttribute('aria-label')));
      });
      const children = [h4, list(document, links)];
      const cta = [...main.querySelectorAll('.builder-blocks a[href]')]
        .find((a) => !social.contains(a) && (social.compareDocumentPosition(a) & 4));
      if (cta) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.append(link(document, cta.getAttribute('href'), textOf(cta)));
        p.append(strong);
        children.push(p);
      }
      sections.push(section(document, ...children));
    }

    // legal links; the "do not sell" button (cookie preferences) stays plain text
    const legal = bottom.querySelector('ul');
    if (legal) {
      const items = [...legal.querySelectorAll(':scope > li')].map((li) => {
        const a = li.querySelector('a[href]');
        return a ? link(document, a.getAttribute('href'), clean(a.textContent)) : clean(li.textContent);
      }).filter(Boolean);
      if (items.length) sections.push(section(document, list(document, items)));
    }

    // copyright
    const copyright = [...bottom.querySelectorAll('p')].find((p) => /©/.test(p.textContent));
    if (copyright) {
      const p = document.createElement('p');
      p.textContent = clean(copyright.textContent);
      sections.push(section(document, p));
    }

    const root = document.createElement('div');
    sections.forEach((s, i) => {
      if (i > 0) root.append(document.createElement('hr'));
      root.append(...s.childNodes);
    });

    WebImporter.rules.adjustImageUrls(root, pageUrl, params.originalURL);

    document.body.replaceChildren(root);
    return [{
      element: document.body,
      path: '/fr/footer',
      report: {
        title: 'French footer',
        template: 'footer-fr',
        sections: sections.length,
      },
    }];
  },
};
