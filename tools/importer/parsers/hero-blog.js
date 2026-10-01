/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-blog. Base: hero. Source: https://www.solarwinds.com/blog
 * Template: blog. Generated: 2026-10-01.
 *
 * Source (validated against block-context/hero-blog/source.html and the Bright Data
 * snapshot bd-snapshots/www.solarwinds.com/blog.html):
 *   .main-featured-post
 *     .text > h2.hero-headline > a[href]           linked headline
 *           > .main-post-info > .date               date (heavily indented text)
 *                             > .author > a          author link
 *                             > .main-post-category > a.category-pill   category link(s)
 *     .hero-image > a[href] > img                   featured image (same href as headline)
 *
 * Output (hero convention, matches blocks/hero-blog/hero-blog.js), 1 column:
 *   row 1: image (the decorator links it to the headline link; a text link is added
 *          only when the image points somewhere else)
 *   row 2: H2 > a, P date, P author link, P category link(s)
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

function link(document, a) {
  const el = document.createElement('a');
  el.href = a.getAttribute('href');
  el.textContent = clean(a.textContent);
  return el;
}

function para(document, ...children) {
  const p = document.createElement('p');
  p.append(...children);
  return p;
}

function image(document, img) {
  const el = document.createElement('img');
  el.src = img.getAttribute('src');
  el.alt = clean(img.getAttribute('alt'));
  return el;
}

export default function parse(element, { document }) {
  const headingSrc = element.querySelector('h2.hero-headline') || element.querySelector('h1, h2, h3');
  const headingLink = headingSrc && headingSrc.querySelector('a[href]');
  const titleHref = headingLink ? headingLink.getAttribute('href') : null;

  const img = [...element.querySelectorAll('img')]
    .find((i) => (i.getAttribute('src') || '') && !/^data:/.test(i.getAttribute('src')));

  const content = [];
  if (headingSrc && clean(headingSrc.textContent)) {
    const h2 = document.createElement('h2');
    h2.append(headingLink ? link(document, headingLink)
      : document.createTextNode(clean(headingSrc.textContent)));
    content.push(h2);
  }

  const info = element.querySelector('.main-post-info') || element;
  const dateEl = info.querySelector('.date');
  const date = clean(dateEl && dateEl.textContent);
  if (date) content.push(para(document, document.createTextNode(date)));

  info.querySelectorAll('.author a[href]').forEach((a) => {
    if (clean(a.textContent)) content.push(para(document, link(document, a)));
  });

  const cats = [...info.querySelectorAll('.main-post-category a[href]')]
    .filter((a) => clean(a.textContent));
  if (cats.length) {
    const p = document.createElement('p');
    cats.forEach((a, i) => {
      if (i) p.append(document.createTextNode(' '));
      p.append(link(document, a));
    });
    content.push(p);
  }

  if (!content.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (img) {
    const imageCell = [image(document, img)];
    const imgLink = img.closest('a[href]');
    const imgHref = imgLink ? imgLink.getAttribute('href') : null;
    if (imgHref && imgHref !== titleHref) {
      const a = document.createElement('a');
      a.href = imgHref;
      a.textContent = imgHref;
      imageCell.push(a);
    }
    cells.push([imageCell]);
  }
  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-blog', cells });
  element.replaceWith(block);
}
