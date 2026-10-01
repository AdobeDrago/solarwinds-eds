/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-podcast. Base: columns. Source: https://www.solarwinds.com/blog
 * Template: blog. Generated: 2026-10-01.
 *
 * Source (validated against block-context/columns-podcast/source.html and the Bright
 * Data snapshot, which carries the real media id):
 *   .sw-om-techpod-block > .sw19s-std-wrap
 *     > .pod-frame > .title                         heading text
 *                  > .player > wistia-player[media-id]   (media-id="null" in cleaned.html)
 *                  > .list-data > a.tag[href] (x3), .date
 *     > .pod-image > img                            episode image
 *     > .title.mobile                               duplicate heading (ignored)
 *     (+ inline <style> sibling, ignored)
 *
 * Wistia id: wistia-player[media-id], else [class*="wistia_async_"], else an iframe/link
 * to fast.wistia.(com|net)/embed/(medias|iframe)/<id>. The episode title is rendered by
 * the Wistia player only (not in the page DOM), so the link text is the image alt when
 * present, else the media URL.
 *
 * Output (columns convention, matches blocks/columns-podcast/columns-podcast.js):
 *   1 row, 2 cells:
 *     cell 1: H2 heading, P > a (https://fast.wistia.com/embed/medias/<id>),
 *             P tag links, P date
 *     cell 2: episode image
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const validId = (id) => (id && /^[a-z0-9]+$/i.test(id) && !/^(null|undefined)$/i.test(id) ? id : null);

function wistiaId(root) {
  const player = [...root.querySelectorAll('wistia-player[media-id]')]
    .map((el) => validId(el.getAttribute('media-id'))).find(Boolean);
  if (player) return player;
  const asyncEl = root.querySelector('[class*="wistia_async_"]');
  if (asyncEl) {
    const m = asyncEl.className.match(/wistia_async_([a-z0-9]+)/i);
    if (m && validId(m[1])) return m[1];
  }
  const embeds = [...root.querySelectorAll('iframe[src*="wistia"], a[href*="wistia"]')];
  for (const el of embeds) {
    const url = el.getAttribute('src') || el.getAttribute('href') || '';
    const m = url.match(/fast\.wistia\.(?:com|net)\/embed\/(?:medias|iframe)\/([a-z0-9]+)/i);
    if (m && validId(m[1])) return m[1];
  }
  return null;
}

function para(document, ...children) {
  const p = document.createElement('p');
  p.append(...children);
  return p;
}

export default function parse(element, { document }) {
  const frame = element.querySelector('.pod-frame') || element;

  const titleEl = frame.querySelector('.title:not(.mobile)') || element.querySelector('.title, h2, h3');
  const title = clean(titleEl && titleEl.textContent);

  const img = [...element.querySelectorAll('.pod-image img, img')]
    .find((i) => (i.getAttribute('src') || '') && !/^data:/.test(i.getAttribute('src')));

  const content = [];
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title;
    content.push(h2);
  }

  const id = wistiaId(element);
  if (id) {
    const a = document.createElement('a');
    a.href = `https://fast.wistia.com/embed/medias/${id}`;
    a.textContent = clean(img && img.getAttribute('alt')) || a.href;
    content.push(para(document, a));
  }

  const tags = [...frame.querySelectorAll('a.tag[href]')].filter((a) => clean(a.textContent));
  if (tags.length) {
    const p = document.createElement('p');
    tags.forEach((tag, i) => {
      if (i) p.append(document.createTextNode(' '));
      const a = document.createElement('a');
      a.href = tag.getAttribute('href');
      a.textContent = clean(tag.textContent);
      p.append(a);
    });
    content.push(p);
  }

  const dateEl = frame.querySelector('.date');
  const date = clean(dateEl && dateEl.textContent);
  if (date) content.push(para(document, document.createTextNode(date)));

  if (!content.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = [content];
  if (img) {
    const el = document.createElement('img');
    el.src = img.getAttribute('src');
    el.alt = clean(img.getAttribute('alt'));
    row.push(el);
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-podcast', cells });
  element.replaceWith(block);
}
