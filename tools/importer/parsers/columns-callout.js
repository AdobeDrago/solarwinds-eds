/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-callout. Base: columns. Source: https://www.solarwinds.com/blog
 * Template: blog. Generated: 2026-10-01.
 *
 * Source (validated against block-context/columns-callout/source.html, instances/01.html
 * and the Bright Data snapshot):
 *   .sw25-om-callout > div.background[style] (> img = rendered background-image)
 *     > .sw19s-std-wrap[.image-on-left]
 *         .left-col  > .headline (div)        -> H2
 *                    > .text > p              -> paragraph(s), inline <strong>/<em>/<a> kept
 *                    > .cta > a.cta-link + img[data: svg icon]   -> CTA link (icon dropped)
 *         .right-col > .image .image-container > a[href] > img + div.overlay
 *
 * Background option: the first callout's div.background carries the patterned band
 * (callout-background.png) — as a direct child <img> in the snapshot/cleaned DOM, or as a
 * CSS background-image url(...) on the live page. The second has url('') / none -> no option.
 *
 * Output (columns convention, matches blocks/columns-callout/columns-callout.js):
 *   block name "columns-callout" (+ variant "background" -> "Columns Callout (background)")
 *   1 row, 2 cells: text | image, or image | text when .image-on-left
 *     text cell:  H2, P..., P > a (CTA)
 *     image cell: img + text link to the image's href (decorator wraps the picture in it)
 */
const norm = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ');
const clean = (s) => norm(s).trim();
const KEEP = /^(STRONG|B|EM|I|A|BR)$/;

// Copy inline content of `src` into `dest`, keeping only simple inline formatting.
function copyInline(document, src, dest) {
  src.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      dest.append(document.createTextNode(norm(node.textContent)));
      return;
    }
    if (node.nodeType !== 1 || /^(STYLE|SCRIPT|NOSCRIPT|SVG|IMG)$/i.test(node.tagName)) return;
    if (KEEP.test(node.tagName)) {
      const tag = node.tagName === 'B' ? 'strong' : node.tagName === 'I' ? 'em' : node.tagName.toLowerCase();
      const el = document.createElement(tag);
      if (tag === 'a') el.href = node.getAttribute('href');
      copyInline(document, node, el);
      dest.append(el);
      return;
    }
    copyInline(document, node, dest);
  });
}

// Trim leading/trailing whitespace of a paragraph built by copyInline.
function trimEdges(el) {
  const first = el.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
}

function hasBackground(element) {
  const bg = element.querySelector('.background');
  if (!bg) return false;
  const style = bg.getAttribute('style') || '';
  const m = style.match(/background-image\s*:\s*url\(\s*['"]?([^'")]*)['"]?\s*\)/i);
  if (m && m[1].trim()) return true;
  const img = bg.querySelector(':scope > img');
  return !!(img && (img.getAttribute('src') || '').trim() && !/^data:/.test(img.getAttribute('src')));
}

export default function parse(element, { document }) {
  const wrap = element.querySelector('.sw19s-std-wrap') || element;
  const textCol = wrap.querySelector('.left-col') || wrap;
  const imageCol = wrap.querySelector('.right-col, .image-container, .image');

  const text = [];
  const headline = textCol.querySelector('.headline, h1, h2, h3');
  if (headline && clean(headline.textContent)) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(headline.textContent);
    text.push(h2);
  }

  const textWrap = textCol.querySelector('.text');
  if (textWrap) {
    const paras = [...textWrap.querySelectorAll('p')];
    (paras.length ? paras : [textWrap]).forEach((src) => {
      if (!clean(src.textContent)) return;
      const p = document.createElement('p');
      copyInline(document, src, p);
      trimEdges(p);
      text.push(p);
    });
  }

  const ctaSrc = textCol.querySelector('.cta a[href], a.cta-link[href]');
  if (ctaSrc && clean(ctaSrc.textContent)) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = ctaSrc.getAttribute('href');
    a.textContent = clean(ctaSrc.textContent);
    p.append(a);
    text.push(p);
  }

  let imageCell = null;
  const img = imageCol && [...imageCol.querySelectorAll('img')]
    .find((i) => (i.getAttribute('src') || '') && !/^data:/.test(i.getAttribute('src')));
  if (img) {
    const el = document.createElement('img');
    el.src = img.getAttribute('src');
    el.alt = clean(img.getAttribute('alt'));
    imageCell = [el];
    const imgLink = img.closest('a[href]');
    if (imgLink) {
      const a = document.createElement('a');
      a.href = imgLink.getAttribute('href');
      a.textContent = imgLink.getAttribute('href');
      imageCell.push(a);
    }
  }

  if (!text.length && !imageCell) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const imageFirst = wrap.classList.contains('image-on-left');
  let row;
  if (!imageCell) row = [text];
  else if (!text.length) row = [imageCell];
  else row = imageFirst ? [imageCell, text] : [text, imageCell];

  const cells = [row];
  const variants = hasBackground(element) ? ['background'] : [];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-callout', variants, cells });
  element.replaceWith(block);
}
