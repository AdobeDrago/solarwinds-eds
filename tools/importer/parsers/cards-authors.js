/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-authors. Base: cards. Source: https://www.solarwinds.com/blog
 * Template: blog. Generated: 2026-10-01.
 *
 * Source (validated against block-context/cards-authors/source.html and the snapshot):
 *   .voices > a.voice[href] (x3, author page)
 *     > .headshot > img
 *     > .text > .name, .title
 *
 * The sibling a.voice anchors wrap block content (html2md may merge adjacent inline
 * siblings), so iteration is keyed on the block-level .text wrappers, paired with the
 * sibling .headshot; the href is read from the enclosing anchor. Fallback: a.voice.
 *
 * Output (cards convention, matches blocks/cards-authors/cards-authors.js), one row per
 * author:
 *   col 1: headshot image
 *   col 2: P > a (name, linked to the author page), P job title
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

const isContentImg = (img) => {
  const src = img.getAttribute('src') || '';
  return src && !src.startsWith('data:');
};

export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('.text')]
    .filter((body) => body.querySelector('.name'))
    .map((body) => {
      const card = body.closest('.voice') || body.parentElement;
      const headshot = card.querySelector('.headshot') || body.previousElementSibling;
      const link = body.closest('a[href]') || card.querySelector('a[href]');
      return {
        body,
        image: headshot ? [...headshot.querySelectorAll('img')].find(isContentImg) : null,
        href: link ? link.getAttribute('href') : null,
      };
    });

  if (!items.length) {
    items = [...element.querySelectorAll('a.voice[href]')].map((a) => ({
      body: a,
      image: [...a.querySelectorAll('img')].find(isContentImg),
      href: a.getAttribute('href'),
    }));
  }

  const cells = [];
  items.forEach(({ body, image, href }) => {
    const nameEl = body.querySelector('.name');
    const name = clean(nameEl ? nameEl.textContent : body.textContent);
    if (!name) return;
    const content = [];
    const nameP = document.createElement('p');
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = name;
      nameP.append(a);
    } else {
      nameP.textContent = name;
    }
    content.push(nameP);

    const titleEl = body.querySelector('.title');
    const title = clean(titleEl && titleEl.textContent);
    if (title) {
      const p = document.createElement('p');
      p.textContent = title;
      content.push(p);
    }

    let imageCell = '';
    if (image) {
      const img = document.createElement('img');
      img.src = image.getAttribute('src');
      img.alt = clean(image.getAttribute('alt'));
      imageCell = img;
    }
    cells.push([imageCell, content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-authors', cells });
  element.replaceWith(block);
}
