/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-resources. Base: cards. Source: https://www.solarwinds.com/
 * Builder.io source: structural/tag-based extraction, no visibility checks.
 *
 * Source: 5 sibling <a class="resources-grid-item"> tiles, each wrapping an <img> and a
 * text div (p eyebrow + p title). Anchors wrapping block content are NOT used as the
 * iteration key (html2md may merge adjacent sibling anchors) — iteration is keyed on
 * each tile's text wrapper (block-level), paired with its sibling image; the href is read
 * from the enclosing anchor and re-attached to the title.
 *
 * Output (matches blocks/cards-resources/cards-resources.js):
 *   one row per card, 2 columns — col 1: image; col 2: eyebrow + linked title
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

const isContentImg = (img) => {
  const src = img.getAttribute('src') || '';
  return src && !src.startsWith('data:') && !/builder-pixel/.test(img.className);
};

export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  // Each tile = <img> + its next sibling text wrapper (both block-level, so the pair
  // survives even if html2md merges the adjacent tile anchors).
  // Builder.io emits <style> siblings on the live page — skip them and empty nodes.
  const nextBody = (from) => {
    let body = from;
    while (body && (/^(STYLE|SCRIPT|NOSCRIPT)$/.test(body.tagName) || !body.querySelector('p, h2, h3, h4, h5, h6'))) {
      body = body.nextElementSibling;
    }
    return body;
  };
  let items = [...element.querySelectorAll('img')].filter(isContentImg).map((image) => {
    let body = nextBody(image.nextElementSibling);
    // FR featured tile wraps the <img> in its own <div> (a > div > img + div text):
    // climb to that wrapper, never past the tile anchor or a node that holds the text.
    let node = image;
    while (!body && node.parentElement && node.parentElement !== element
      && node.parentElement.tagName !== 'A'
      && !node.parentElement.querySelector('p, h2, h3, h4, h5, h6')) {
      node = node.parentElement;
      body = nextBody(node.nextElementSibling);
    }
    const link = image.closest('a[href]');
    return { body, image, href: link ? link.getAttribute('href') : null };
  }).filter((item) => item.body);

  if (!items.length) {
    // Fallback: tiles are intact anchors.
    items = [...element.querySelectorAll('a[href]')].map((a) => ({
      body: a,
      image: [...a.querySelectorAll('img')].find(isContentImg),
      href: a.getAttribute('href'),
    }));
  }

  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = items.map(({ body, image, href }) => {
    const texts = [...body.querySelectorAll('p')].map((p) => clean(p.textContent)).filter(Boolean);
    const content = [];
    const titleText = texts.length > 1 ? texts[texts.length - 1] : texts[0] || clean(body.textContent);
    texts.slice(0, -1).forEach((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      content.push(p);
    });
    const titleP = document.createElement('p');
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = titleText;
      titleP.append(a);
    } else {
      titleP.textContent = titleText;
    }
    content.push(titleP);
    return [image || '', content];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-resources', cells });
  element.replaceWith(block);
}
