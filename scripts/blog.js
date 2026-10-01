/*
 * Helpers shared by the blog listing blocks (hero-blog, cards-posts, columns-topics,
 * columns-podcast). They only classify and regroup authored content; each block keeps
 * its own class names, passed in as `prefix`.
 */

/**
 * The URL path of a link, or '' when it can't be parsed.
 * @param {Element} a
 * @returns {string}
 */
function linkPath(a) {
  try {
    return new URL(a.getAttribute('href'), window.location.href).pathname;
  } catch {
    return '';
  }
}

/**
 * A blog category or tag link (rendered as a pill).
 * @param {Element} a
 * @returns {boolean}
 */
export function isTermLink(a) {
  return /\/blog\/(category|tag)\//.test(linkPath(a));
}

/**
 * A blog author link.
 * @param {Element} a
 * @returns {boolean}
 */
export function isAuthorLink(a) {
  return /\/blog\/author\//.test(linkPath(a));
}

/**
 * An element whose text is nothing but category/tag links.
 * @param {Element} el
 * @returns {boolean}
 */
export function isTermsOnly(el) {
  const links = [...el.querySelectorAll('a[href]')];
  if (!links.length || !links.every(isTermLink)) return false;
  const linkText = links.map((a) => a.textContent).join('').replace(/\s+/g, '');
  return el.textContent.replace(/[\s|,]+/g, '') === linkText;
}

/**
 * Undo decorateButtons (scripts.js): post titles and meta links render as plain links.
 * @param {Element} root
 */
export function clearButtons(root) {
  root.querySelectorAll('.button-wrapper').forEach((el) => el.classList.remove('button-wrapper'));
  root.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary', 'accent'));
}

/**
 * A post title: a heading, a bold paragraph, or a paragraph holding only a link that is
 * not an author or category/tag link. Call before clearButtons (a bold link may
 * already have been turned into a button).
 * @param {Element} el
 * @returns {boolean}
 */
export function isPostTitle(el) {
  if (/^H[1-6]$/.test(el.tagName)) return true;
  if (el.tagName !== 'P') return false;
  if (el.querySelector('strong, b, a.button')) return true;
  const links = el.querySelectorAll('a[href]');
  return links.length === 1
    && !isAuthorLink(links[0])
    && !isTermLink(links[0])
    && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * Split an element's child nodes on "|" separators in its text.
 * @param {Element} el
 * @returns {Node[][]} one node list per non-empty segment
 */
function splitOnPipes(el) {
  const segments = [[]];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.includes('|')) {
      segments.at(-1).push(node);
      return;
    }
    const parts = node.textContent.split('|');
    parts.forEach((part, i) => {
      if (i) segments.push([]);
      let text = part;
      if (i > 0) text = text.trimStart();
      if (i < parts.length - 1) text = text.trimEnd();
      if (text) segments.at(-1).push(document.createTextNode(text));
    });
  });
  return segments.filter((nodes) => nodes.some((n) => n.textContent.trim()));
}

/**
 * Mark category/tag links as pills and group them.
 * @param {Element[]} elements term-only paragraphs
 * @param {string} prefix block class prefix
 * @returns {Element}
 */
export function buildTerms(elements, prefix) {
  const terms = document.createElement('div');
  terms.className = `${prefix}-terms`;
  elements.forEach((el) => {
    el.querySelectorAll('a[href]').forEach((a) => {
      a.classList.add(`${prefix}-term`);
      terms.append(a);
    });
  });
  return terms;
}

/**
 * Collect meta paragraphs (date, author, optional category/tag pills) into one inline
 * meta line. "date | author" in a single paragraph is split on the pipe.
 * @param {Element[]} elements
 * @param {string} prefix block class prefix
 * @returns {Element}
 */
export function buildMeta(elements, prefix) {
  const meta = document.createElement('div');
  meta.className = `${prefix}-meta`;
  elements.forEach((el) => {
    if (isTermsOnly(el)) {
      const terms = buildTerms([el], prefix);
      terms.classList.add(`${prefix}-meta-item`);
      meta.append(terms);
      return;
    }
    splitOnPipes(el).forEach((nodes) => {
      const item = document.createElement('span');
      item.className = `${prefix}-meta-item`;
      item.append(...nodes);
      meta.append(item);
    });
  });
  return meta;
}

/**
 * A cell that holds a picture and no text other than link text (a linked image is
 * often authored as the picture followed by its URL).
 * @param {Element} cell
 * @returns {boolean}
 */
export function isImageCell(cell) {
  if (!cell.querySelector('picture') || cell.querySelector('h1, h2, h3, h4, h5, h6')) return false;
  const text = cell.cloneNode(true);
  text.querySelectorAll('a').forEach((a) => a.remove());
  return !text.textContent.trim();
}

/**
 * Take the first picture out of an image cell, linked to the post: an authored link
 * around the picture is kept, else a text link in the cell (removed) or `fallbackHref`
 * is used. The image link duplicates the title link, so it is hidden from assistive
 * tech and the tab order.
 * @param {Element} cell
 * @param {string|null} [fallbackHref]
 * @returns {Element|null} the picture or its link
 */
export function extractImage(cell, fallbackHref = null) {
  const picture = cell.querySelector('picture');
  if (!picture) return null;
  let link = picture.closest('a');
  if (!link) {
    const textLink = [...cell.querySelectorAll('a[href]')].find((a) => !a.contains(picture));
    const href = textLink ? textLink.getAttribute('href') : fallbackHref;
    if (textLink) textLink.remove();
    if (href) {
      link = document.createElement('a');
      link.href = href;
      picture.replaceWith(link);
      link.append(picture);
    }
  }
  if (!link) {
    picture.remove();
    return picture;
  }
  link.remove();
  link.tabIndex = -1;
  link.setAttribute('aria-hidden', 'true');
  link.removeAttribute('title');
  return link;
}
