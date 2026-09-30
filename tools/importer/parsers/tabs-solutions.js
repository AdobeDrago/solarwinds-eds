/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-solutions. Base: tabs. Source: https://www.solarwinds.com/
 * Builder.io source: structural/tag-based extraction, no visibility checks —
 * every panel is read from the DOM (not just the active one).
 *
 * Source structure (validated against block-context/tabs-solutions/source.html):
 *   - tab labels: ul > li (desktop tab strip); a mobile <button> duplicates the active label
 *   - illustrations: one icon <img> per tab (alt "icon <tab name>"), in the shared diagram
 *   - panels: sibling wrappers each holding p + primary CTA <a>, and optionally
 *     h3 "... capabilities" followed by a group of link <a>s
 *
 * Output (matches blocks/tabs-solutions/tabs-solutions.js):
 *   one row per tab, 2 columns — col 1: tab label, col 2: image, paragraph, CTA, h3, ul of links
 */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

// Panel loop videos are Wistia players injected client-side, so they're absent from
// static snapshots. Fallback ids come from the page's Builder.io data (uuid per tab).
const WISTIA_FALLBACK = {
  'monitoring and observability': 'jdpqf2s0o1',
  database: 'v02o141sgs',
  'incident response': 'l17y5a7d17',
  'it service management': 'ffbx1mosse',
};

function makeLink(document, a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  link.textContent = clean(a.textContent);
  return link;
}

// Climb from `node` to the direct child of `root` that contains it.
function childOf(root, node) {
  let cur = node;
  while (cur && cur.parentElement !== root) cur = cur.parentElement;
  return cur;
}

// Lowest common ancestor of a list of nodes.
function commonAncestor(nodes) {
  if (!nodes.length) return null;
  let anc = nodes[0].parentElement;
  while (anc && !nodes.every((n) => anc.contains(n))) anc = anc.parentElement;
  return anc;
}

export default function parse(element, { document }) {
  element.querySelectorAll('.b-53874').forEach((el) => el.remove());

  // Panels: each panel owns exactly one body paragraph.
  const paragraphs = [...element.querySelectorAll('p')].filter((p) => clean(p.textContent));
  const track = paragraphs.length > 1 ? commonAncestor(paragraphs) : paragraphs[0]?.parentElement;
  const panels = [];
  paragraphs.forEach((p) => {
    const panel = paragraphs.length > 1 ? childOf(track, p) : p.parentElement;
    if (panel && !panels.includes(panel)) panels.push(panel);
  });

  if (!panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Tab labels from the tab strip list; fall back to the panel CTA text.
  const labels = [...element.querySelectorAll('ul > li')]
    .filter((li) => !track || !track.contains(li))
    .map((li) => clean(li.textContent))
    .filter(Boolean);

  // Illustrations: real (non data-URI) images outside the panel track.
  const icons = [...element.querySelectorAll('img')].filter((img) => {
    const src = img.getAttribute('src') || '';
    return src && !src.startsWith('data:') && !(track && track.contains(img));
  });

  const cells = [];
  panels.forEach((panel, i) => {
    const heading = panel.querySelector('h3, h4, h2');
    // Capabilities group: nearest ancestor of the h3 (inside the panel) that also holds links.
    // The h3 is wrapped in Builder.io text divs, so climb rather than using parentElement.
    let headingGroup = heading ? heading.parentElement : null;
    while (headingGroup && headingGroup !== panel && !headingGroup.querySelector('a[href]')) {
      headingGroup = headingGroup.parentElement;
    }
    if (headingGroup === panel) {
      // Links share the panel root with the CTA: take only anchors that follow the heading.
      headingGroup = null;
    }
    let links = headingGroup
      ? [...headingGroup.querySelectorAll('a[href]')].filter((a) => clean(a.textContent))
      : [];
    if (!headingGroup && heading) {
      links = [...panel.querySelectorAll('a[href]')].filter((a) => clean(a.textContent)
        // eslint-disable-next-line no-bitwise
        && (heading.compareDocumentPosition(a) & 4));
    }
    const para = panel.querySelector('p');
    const cta = [...panel.querySelectorAll('a[href]')]
      .find((a) => clean(a.textContent) && !links.includes(a));

    let label = labels[i];
    if (!label && cta) label = clean(cta.textContent).replace(/^Explore\s+/i, '');
    if (!label && heading) label = clean(heading.textContent).replace(/\s+capabilities$/i, '');
    label = label || `Tab ${i + 1}`;

    const icon = icons.find((img) => clean(img.getAttribute('alt')).toLowerCase() === `icon ${label.toLowerCase()}`)
      || icons[i];

    const content = [];
    if (icon) content.push(icon.cloneNode(true));
    const player = panel.querySelector('wistia-player[media-id]');
    const videoId = (player && player.getAttribute('media-id')) || WISTIA_FALLBACK[label.toLowerCase()];
    if (videoId) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = `https://fast.wistia.com/embed/medias/${videoId}`;
      a.textContent = `${label} video`;
      p.append(a);
      content.push(p);
    }
    if (para) {
      const p = document.createElement('p');
      p.innerHTML = para.innerHTML;
      content.push(p);
    }
    if (cta) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.append(makeLink(document, cta));
      p.append(strong);
      content.push(p);
    }
    if (heading) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(heading.textContent);
      content.push(h3);
    }
    if (links.length) {
      const ul = document.createElement('ul');
      links.forEach((a) => {
        const li = document.createElement('li');
        li.append(makeLink(document, a));
        ul.append(li);
      });
      content.push(ul);
    }

    cells.push([label, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-solutions', cells });
  element.replaceWith(block);
}
