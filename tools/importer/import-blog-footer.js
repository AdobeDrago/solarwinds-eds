/* eslint-disable */
/* global WebImporter */

/**
 * Import script: the SolarWinds blog footer (footer.sw25-om-footer on
 * https://www.solarwinds.com/blog) -> the /blog/footer fragment.
 *
 * Modelled like /footer (blocks/footer/footer.js classifies the sections by content):
 *   section 1 (brand): the SolarWinds logo, then the "about" paragraph
 *   sections 2-6 (columns): a heading holding the column's link (the source's
 *     "main-link", e.g. "Try SolarWinds" -> /products), then the list of links
 *   section 7 (social): a "Follow Us" heading, a list of the social links (named by
 *     network; rendered as icons), then the CTA as a bold link
 *   section 8 (legal): the list of legal links
 *   section 9 (copyright): the copyright line
 *
 * Source DOM (verified against tools/importer/bd-snapshots/www.solarwinds.com/blog.html):
 *   footer.sw25-om-footer
 *     .footer-content-grid .grid-col-1 .content-logo img + .content-text p
 *     .groups-links ul.block-links > li > a.footer-link(.main-link first)
 *     .groups-links .social-block ul.social-links > li > a[aria-label] (data: svg icon)
 *       + a.sw33-button (CTA)
 *     .footer-legal-grid ul > li > a
 *     .footer-light-background .sw19s-std-wrap (copyright text)
 */

const SOCIAL = [
  ['Facebook', /facebook\.com/],
  ['Instagram', /instagram\.com/],
  ['X', /(twitter|x)\.com/],
  ['YouTube', /youtube\.com|youtu\.be/],
  ['LinkedIn', /linkedin\.com/],
];

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function link(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

function list(document, links) {
  const ul = document.createElement('ul');
  links.forEach((a) => {
    const li = document.createElement('li');
    li.append(a);
    ul.append(li);
  });
  return ul;
}

function section(document, ...children) {
  const div = document.createElement('div');
  div.append(...children);
  return div;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const footer = document.querySelector('footer.sw25-om-footer');
    if (!footer) throw new Error('Blog footer (footer.sw25-om-footer) not found');

    const sections = [];

    // brand: logo + about paragraph
    const brand = [];
    const logo = footer.querySelector('.content-logo img');
    if (logo) {
      const p = document.createElement('p');
      const img = document.createElement('img');
      img.src = logo.getAttribute('src');
      img.alt = 'SolarWinds';
      p.append(img);
      brand.push(p);
    }
    footer.querySelectorAll('.content-text p').forEach((src) => {
      const p = document.createElement('p');
      p.textContent = clean(src.textContent);
      brand.push(p);
    });
    if (brand.length) sections.push(section(document, ...brand));

    // link columns: the main link becomes the (linked) heading
    footer.querySelectorAll('.groups-links ul.block-links').forEach((ul) => {
      const links = [...ul.querySelectorAll(':scope > li > a[href]')];
      const main = links.find((a) => a.classList.contains('main-link')) || links[0];
      if (!main) return;
      const h4 = document.createElement('h4');
      h4.append(link(document, main.getAttribute('href'), clean(main.textContent)));
      const rest = links.filter((a) => a !== main)
        .map((a) => link(document, a.getAttribute('href'), clean(a.textContent)));
      sections.push(section(document, h4, list(document, rest)));
    });

    // social links + CTA
    const social = footer.querySelector('.social-block');
    if (social) {
      const h4 = document.createElement('h4');
      h4.textContent = 'Follow Us';
      const links = [...social.querySelectorAll('ul.social-links a[href]')].map((a) => {
        const href = a.getAttribute('href');
        const match = SOCIAL.find(([, re]) => re.test(href));
        return link(document, href, match ? match[0] : clean(a.getAttribute('aria-label')));
      });
      const children = [h4, list(document, links)];
      const cta = social.querySelector(':scope > a[href]');
      if (cta) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.append(link(document, cta.getAttribute('href'), clean(cta.textContent)));
        p.append(strong);
        children.push(p);
      }
      sections.push(section(document, ...children));
    }

    // legal links
    const legal = [...footer.querySelectorAll('.footer-legal-grid li a[href]')]
      .map((a) => link(document, a.getAttribute('href'), clean(a.textContent)));
    if (legal.length) sections.push(section(document, list(document, legal)));

    // copyright
    const copyright = footer.querySelector('.footer-light-background');
    if (copyright && clean(copyright.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(copyright.textContent);
      sections.push(section(document, p));
    }

    const root = document.createElement('div');
    sections.forEach((s, i) => {
      if (i > 0) root.append(document.createElement('hr'));
      root.append(...s.childNodes);
    });

    WebImporter.rules.adjustImageUrls(root, url, params.originalURL);

    document.body.replaceChildren(root);
    return [{
      element: document.body,
      path: '/blog/footer',
      report: {
        title: 'Blog footer',
        template: 'blog-footer',
        sections: sections.length,
      },
    }];
  },
};
