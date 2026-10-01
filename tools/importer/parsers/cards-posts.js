/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-posts. Base: cards. Source: https://www.solarwinds.com/blog
 * Template: blog. Generated: 2026-10-01.
 *
 * Two source shapes (validated against block-context/cards-posts/source.html,
 * instances/01.html and the Bright Data snapshot):
 *
 * 1) .sw25-om-homepage-hero .featured-posts > .featured-post (x3)
 *      .featured-post-image > a[href] > img
 *      .featured-post-text > .featured-post-categories > a.category-pill   (may be EMPTY)
 *                          > h3.featured-post-headline > a[href]
 *      .date-and-author > .date, .author > a
 *
 * 2) .sw25-om-category-spotlight .block-head + .block-article — the selector matches only
 *    the FIRST of the sibling .block-article cards, so the element and all following
 *    .block-article siblings are gathered into ONE block; the extra siblings are removed
 *    so they do not import as stray default content.
 *      .article-image > a[href] > img + div.overlay (empty, dropped)
 *      .article-cat > a (1-2 category links)
 *      a.article-title[href] > h3        -> output as H3 > a
 *      .article-extra > .article-date, a.article-author
 *
 * Iteration is keyed on the block-level card wrappers (.featured-post / .block-article),
 * never on the anchors.
 *
 * Output (cards convention, matches blocks/cards-posts/cards-posts.js), one row per post:
 *   col 1: image (decorator links it to the title link; a text link is added only when
 *          the image points elsewhere)
 *   col 2: [P category link(s)], H3 > a title, P date, P author link
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

function link(document, href, text) {
  const el = document.createElement('a');
  el.href = href;
  el.textContent = text;
  return el;
}

function para(document, ...children) {
  const p = document.createElement('p');
  p.append(...children);
  return p;
}

function contentImg(root) {
  return [...root.querySelectorAll('img')]
    .find((i) => (i.getAttribute('src') || '') && !/^data:/.test(i.getAttribute('src')));
}

// Highest ancestor of each h3 below root that holds only that h3 (fallback items).
function headingItems(root) {
  const items = [];
  root.querySelectorAll('h3').forEach((h3) => {
    let item = h3;
    while (item.parentElement && item.parentElement !== root
      && item.parentElement.querySelectorAll('h3').length === 1) item = item.parentElement;
    if (!items.includes(item)) items.push(item);
  });
  return items;
}

function parseCard(document, card) {
  card.querySelectorAll('.overlay').forEach((el) => { if (!clean(el.textContent)) el.remove(); });

  const heading = card.querySelector('h3') || card.querySelector('h2, h4');
  const titleText = clean(heading && heading.textContent);
  if (!titleText) return null;
  const titleLink = heading.querySelector('a[href]') || heading.closest('a[href]');
  const titleHref = titleLink ? titleLink.getAttribute('href') : null;

  const body = [];
  const cats = [...card.querySelectorAll('.featured-post-categories a[href], .article-cat a[href]')]
    .filter((a) => clean(a.textContent));
  if (cats.length) {
    const p = document.createElement('p');
    cats.forEach((a, i) => {
      if (i) p.append(document.createTextNode(' '));
      p.append(link(document, a.getAttribute('href'), clean(a.textContent)));
    });
    body.push(p);
  }

  const h3 = document.createElement('h3');
  h3.append(titleHref ? link(document, titleHref, titleText) : document.createTextNode(titleText));
  body.push(h3);

  const dateEl = card.querySelector('.date, .article-date');
  const date = clean(dateEl && dateEl.textContent);
  if (date) body.push(para(document, document.createTextNode(date)));

  const author = card.querySelector('.author a[href], a.article-author[href]');
  if (author && clean(author.textContent)) {
    body.push(para(document, link(document, author.getAttribute('href'), clean(author.textContent))));
  }

  let imageCell = '';
  const img = contentImg(card);
  if (img) {
    const el = document.createElement('img');
    el.src = img.getAttribute('src');
    el.alt = clean(img.getAttribute('alt'));
    imageCell = [el];
    const imgLink = img.closest('a[href]');
    const imgHref = imgLink ? imgLink.getAttribute('href') : null;
    if (imgHref && imgHref !== titleHref) imageCell.push(link(document, imgHref, imgHref));
  }
  return [imageCell, body];
}

export default function parse(element, { document }) {
  let cards;
  const extras = [];
  if (element.classList.contains('block-article')) {
    // Spotlight: this element + every following .block-article sibling = one block.
    cards = [element];
    let next = element.nextElementSibling;
    while (next) {
      if (next.classList.contains('block-article')) {
        cards.push(next);
        extras.push(next);
      }
      next = next.nextElementSibling;
    }
  } else {
    cards = [...element.querySelectorAll('.featured-post, .block-article')]
      .filter((c) => !c.parentElement.closest('.featured-post, .block-article'));
    if (!cards.length) cards = headingItems(element);
  }

  const cells = cards.map((card) => parseCard(document, card)).filter(Boolean);
  extras.forEach((el) => el.remove());

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-posts', cells });
  element.replaceWith(block);
}
