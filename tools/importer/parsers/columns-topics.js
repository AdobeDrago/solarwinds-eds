/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-topics. Base: columns. Source: https://www.solarwinds.com/blog
 * Template: blog. Generated: 2026-10-01.
 *
 * Source (validated against block-context/columns-topics/source.html and the snapshot):
 *   .categories > .column (x3)
 *     > h3.link-headline > a.category-link[href] (text + chevron <img data:svg> / <svg>)
 *     > .category-posts > .post-info (x2)
 *         > a.post-link[href]                       post title
 *         > .date-and-author > .date, .author > a   date, author link
 *
 * Output (columns convention, matches blocks/columns-topics/columns-topics.js):
 *   1 row, one cell per topic column:
 *     H3 > a (category, source casing kept, chevron dropped),
 *     then per post: P > a (title), P date, P author link
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

function link(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

function para(document, child) {
  const p = document.createElement('p');
  p.append(child);
  return p;
}

// Text of a node without <style>/<script>/<svg> content.
function textOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || /^(STYLE|SCRIPT|NOSCRIPT|SVG)$/i.test(node.tagName)) return '';
  return [...node.childNodes].map(textOf).join('');
}

function parseColumn(document, column) {
  const cell = [];
  const heading = column.querySelector('h3, h2, h4');
  const headText = clean(textOf(heading));
  if (headText) {
    const h3 = document.createElement('h3');
    const headLink = heading.querySelector('a[href]');
    h3.append(headLink ? link(document, headLink.getAttribute('href'), headText)
      : document.createTextNode(headText));
    cell.push(h3);
  }

  let posts = [...column.querySelectorAll('.post-info')];
  if (!posts.length) {
    posts = [...column.querySelectorAll('a.post-link')].map((a) => a.parentElement);
  }
  posts.forEach((post) => {
    const title = post.querySelector('a.post-link[href]')
      || [...post.querySelectorAll('a[href]')].find((a) => !a.closest('.author'));
    const titleText = clean(textOf(title));
    if (!titleText) return;
    cell.push(para(document, link(document, title.getAttribute('href'), titleText)));

    const dateEl = post.querySelector('.date');
    const date = clean(dateEl && dateEl.textContent);
    if (date) cell.push(para(document, document.createTextNode(date)));

    const author = post.querySelector('.author a[href]');
    if (author && clean(author.textContent)) {
      cell.push(para(document, link(document, author.getAttribute('href'), clean(author.textContent))));
    }
  });
  return cell;
}

export default function parse(element, { document }) {
  let columns = [...element.querySelectorAll(':scope > .column')];
  if (!columns.length) columns = [...element.querySelectorAll('.column')];
  if (!columns.length) {
    // Fallback: each topic heading's highest ancestor holding only that heading.
    element.querySelectorAll('h3').forEach((h3) => {
      let col = h3;
      while (col.parentElement && col.parentElement !== element
        && col.parentElement.querySelectorAll('h3').length === 1) col = col.parentElement;
      if (!columns.includes(col)) columns.push(col);
    });
  }

  const row = columns.map((col) => parseColumn(document, col)).filter((cell) => cell.length);
  if (!row.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-topics', cells });
  element.replaceWith(block);
}
