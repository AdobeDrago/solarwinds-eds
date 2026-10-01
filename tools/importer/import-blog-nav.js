/* eslint-disable */
/* global WebImporter */

/**
 * Import script: the SolarWinds blog header (div.orangematter-header on
 * https://www.solarwinds.com/blog) -> the /blog/nav fragment.
 *
 * The blog pages carry their own header (no promo banner, no main site header), so
 * it is authored as a separate nav document, modelled like /nav:
 *   section 1 (brand): the "SolarWinds Blog" logo linked to the blog home, then the
 *     flame mark the source shows in its mobile / tablet bar (optional)
 *   section 2 (sections): one list item per top-level item. A label followed by a
 *     nested list is a dropdown (each entry: icon image + category link); a plain
 *     link is a direct item (TechPod)
 *   section 3 (tools): the search link; its query parameter names the search field
 *     (the source form submits to /blog/search?term=...)
 *
 * Source DOM (verified against tools/importer/bd-snapshots/www.solarwinds.com/blog.html):
 *   .om-navigation .om-logo a > img[srcset]          desktop logo (768/300/1000w)
 *   .om-navigation .mobile-logo img                   mobile flame mark (200 x 160)
 *   .om-navigation ul.menu > li.menu-item             Platform / TechPod / Resources
 *     > button.nav-item + .popup .panel-item .panel-title > img + a
 *     > a.nav-item                                    direct link
 *   .om-navigation li.search-item form[action] input[name]
 */

const BLOG_HOME = '/blog';

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/** The largest candidate of an image's srcset (the one the image map localizes). */
function largestSrc(img) {
  const srcset = img.getAttribute('srcset') || '';
  let best = null;
  srcset.split(',').forEach((candidate) => {
    const [src, descriptor] = candidate.trim().split(/\s+/);
    const w = parseInt(descriptor, 10) || 0;
    if (src && (!best || w > best.w)) best = { src, w };
  });
  return best ? best.src : img.getAttribute('src');
}

function image(document, src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}

function link(document, href, content) {
  const a = document.createElement('a');
  a.href = href;
  if (typeof content === 'string') a.textContent = content;
  else a.append(content);
  return a;
}

function buildBrand(document, nav) {
  const section = document.createElement('div');
  const logo = nav.querySelector('.om-logo img');
  if (logo) {
    const p = document.createElement('p');
    p.append(link(document, BLOG_HOME, image(document, largestSrc(logo), 'SolarWinds Blog')));
    section.append(p);
  }
  const mark = nav.querySelector('.mobile-logo img');
  if (mark) {
    const p = document.createElement('p');
    p.append(link(document, BLOG_HOME, image(document, largestSrc(mark), 'SolarWinds')));
    section.append(p);
  }
  return section;
}

function buildSections(document, nav) {
  const section = document.createElement('div');
  const list = document.createElement('ul');
  nav.querySelectorAll('ul.menu > li.menu-item').forEach((item) => {
    const li = document.createElement('li');
    const popup = item.querySelector('.popup');
    const direct = item.querySelector(':scope > a.nav-item[href]');
    if (popup) {
      li.append(clean(item.querySelector(':scope > .nav-item').textContent));
      const sub = document.createElement('ul');
      popup.querySelectorAll('.panel-item .panel-title').forEach((title) => {
        const a = title.querySelector('a[href]');
        if (!a) return;
        const entry = document.createElement('li');
        const icon = title.querySelector('img');
        if (icon) entry.append(image(document, largestSrc(icon), ''), ' ');
        entry.append(link(document, a.getAttribute('href'), clean(a.textContent)));
        sub.append(entry);
      });
      li.append(sub);
    } else if (direct) {
      li.append(link(document, direct.getAttribute('href'), clean(direct.textContent)));
    } else {
      return;
    }
    list.append(li);
  });
  section.append(list);
  return section;
}

function buildTools(document, nav) {
  const section = document.createElement('div');
  const form = nav.querySelector('.search-item form[action]');
  if (form) {
    const field = form.querySelector('input[name]');
    const href = `${form.getAttribute('action')}?${field ? field.getAttribute('name') : 'term'}=`;
    const list = document.createElement('ul');
    const li = document.createElement('li');
    li.append(link(document, href, clean(field && field.getAttribute('placeholder')) || 'Search'));
    list.append(li);
    section.append(list);
  }
  return section;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const nav = document.querySelector('.orangematter-header .om-navigation');
    if (!nav) throw new Error('Blog header (.orangematter-header .om-navigation) not found');

    const root = document.createElement('div');
    const sections = [buildBrand(document, nav), buildSections(document, nav), buildTools(document, nav)];
    sections.forEach((section, i) => {
      if (i > 0) root.append(document.createElement('hr'));
      root.append(...section.childNodes);
    });

    WebImporter.rules.adjustImageUrls(root, url, params.originalURL);

    document.body.replaceChildren(root);
    return [{
      element: document.body,
      path: '/blog/nav',
      report: {
        title: 'Blog nav',
        template: 'blog-nav',
        items: nav.querySelectorAll('ul.menu > li.menu-item').length,
      },
    }];
  },
};
