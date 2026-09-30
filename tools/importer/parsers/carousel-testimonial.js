/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-testimonial. Base: carousel. Source: https://www.solarwinds.com/
 * Builder.io + slick carousel: structural/tag-based extraction, no visibility checks,
 * so every slide is captured (not just the active one).
 *
 * Source (validated against block-context/carousel-testimonial/source.html):
 *   quote track: .slick-track > .slick-slide, each slide holds
 *     p (quote), a (case study / review link), a group of 3 p (name, title, company), img (logo)
 *   a second .slick-track holds only logo images (thumbnail strip) — ignored.
 *   slick may add .slick-cloned copies — skipped, and slides are de-duplicated by quote text.
 *
 * Output (matches blocks/carousel-testimonial/carousel-testimonial.js):
 *   one row per slide, 2 columns — col 1: logo image; col 2: quote, link, name, title, company
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

function childOf(root, node) {
  let cur = node;
  while (cur && cur.parentElement !== root) cur = cur.parentElement;
  return cur;
}

function commonAncestor(nodes) {
  let anc = nodes[0].parentElement;
  while (anc && !nodes.every((n) => anc.contains(n))) anc = anc.parentElement;
  return anc;
}

const isContentImg = (img) => {
  const src = img.getAttribute('src') || '';
  // inline SVG icons arrive as data: URIs, or blob: once the importer has loaded the page
  return src && !/^(data|blob):/.test(src) && !/builder-pixel/.test(img.className);
};

export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  // Slides: slick slides that hold text content.
  let slides = [...element.querySelectorAll('.slick-slide')]
    .filter((s) => !s.classList.contains('slick-cloned') && s.querySelector('p'));
  if (!slides.length) {
    // Fallback (carousel not initialised): each slide owns exactly one link.
    const anchors = [...element.querySelectorAll('a[href]')].filter((a) => clean(a.textContent));
    if (anchors.length) {
      const root = anchors.length > 1 ? commonAncestor(anchors) : anchors[0].parentElement.parentElement;
      anchors.forEach((a) => {
        const s = childOf(root, a);
        if (s && !slides.includes(s)) slides.push(s);
      });
    }
  }
  // Nested slick markup: keep only the outermost slide elements.
  slides = slides.filter((s) => !slides.some((o) => o !== s && o.contains(s)));

  const seen = new Set();
  const cells = [];
  slides.forEach((slide) => {
    const paras = [...slide.querySelectorAll('p')].filter((p) => clean(p.textContent));
    const quote = paras[0];
    if (!quote) return;
    const key = clean(quote.textContent);
    if (seen.has(key)) return;
    seen.add(key);

    const link = [...slide.querySelectorAll('a[href]')].find((a) => clean(a.textContent));
    const attribution = paras.slice(1).filter((p) => !(link && link.contains(p)));
    const logo = [...slide.querySelectorAll('img')].find(isContentImg);

    const content = [];
    const q = document.createElement('p');
    q.textContent = key;
    content.push(q);
    if (link) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = clean(link.textContent);
      p.append(a);
      content.push(p);
    }
    attribution.forEach((para, i) => {
      const p = document.createElement('p');
      if (i === 0) {
        // name
        const strong = document.createElement('strong');
        strong.textContent = clean(para.textContent);
        p.append(strong);
      } else {
        p.textContent = clean(para.textContent);
      }
      content.push(p);
    });

    cells.push([logo || '', content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
  element.replaceWith(block);
}
