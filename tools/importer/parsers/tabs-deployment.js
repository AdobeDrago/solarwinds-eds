/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-deployment. Base: tabs. Source: https://www.solarwinds.com/pricing
 * Template: pricing. Generated: 2026-09-30.
 *
 * Source structure (Builder.io, validated against block-context/tabs-deployment/source.html
 * and migration-work/cleaned.html):
 *   The instance (.builder-4d439d8d… / .sticky-filter-heading) holds only the heading:
 *     h2 > [decorative img] span > .builder-text "Filter by Deployment" [decorative img]
 *   The filter buttons are in a following sibling subtree (Builder tabs widget):
 *     .builder-tabs-wrap > span.builder-tab-wrap[.builder-tab-active] > … > button >
 *       span.tab-heading (label) + span.tab-sub-head (sub-label)
 *   The tabs widget's panel (the product lists) is a sibling of .builder-tabs-wrap and
 *   is left untouched for the cards-products parser; only .builder-tabs-wrap is consumed.
 *
 * Output (blocks/tabs-deployment/tabs-deployment.js):
 *   row 1 (1 cell): H2 "Filter by Deployment"
 *   rows 2-4 (2 cells): label | sub-label — the active/default label ("All") in bold.
 */
const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

// Text of a node, ignoring inline <style>/<script> content (Builder.io inlines styles).
function textOf(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || /^(STYLE|SCRIPT|NOSCRIPT)$/.test(node.tagName)) return '';
  let text = '';
  node.childNodes.forEach((child) => {
    const t = textOf(child);
    text += /^(P|DIV|LI|H[1-6]|BR)$/.test(child.tagName || '') ? ` ${t} ` : t;
  });
  return text;
}

// Nearest .builder-tabs-wrap: inside the element, else in an enclosing ancestor
// (the widget follows the heading as a sibling subtree).
function findTabsWrap(element) {
  const inside = element.querySelector('.builder-tabs-wrap');
  if (inside) return inside;
  for (let scope = element.parentElement, depth = 0; scope && depth < 8; scope = scope.parentElement, depth += 1) {
    const wrap = [...scope.querySelectorAll('.builder-tabs-wrap')]
      // eslint-disable-next-line no-bitwise
      .find((w) => element.compareDocumentPosition(w) & 4); // DOCUMENT_POSITION_FOLLOWING
    if (wrap) return wrap;
  }
  return null;
}

export default function parse(element, { document }) {
  const headingEl = element.querySelector('h1, h2, h3, h4, h5, h6');
  const headingText = clean(textOf(headingEl || element));

  const wrap = findTabsWrap(element);
  const tabs = [];
  if (wrap) {
    let items = [...wrap.querySelectorAll('.builder-tab-wrap')];
    if (!items.length) items = [...wrap.querySelectorAll('button')];
    items.forEach((item) => {
      const labelEl = item.querySelector('.tab-heading');
      const subEl = item.querySelector('.tab-sub-head');
      let label = clean(textOf(labelEl));
      let sub = clean(textOf(subEl));
      if (!labelEl) {
        // fallback: first/second text chunk of the button
        const chunks = [...item.querySelectorAll('.builder-text')].map((el) => clean(textOf(el))).filter(Boolean);
        [label = '', sub = ''] = chunks;
      }
      if (!label) return;
      const active = item.classList.contains('builder-tab-active')
        || item.getAttribute('aria-selected') === 'true';
      tabs.push({ label, sub, active });
    });
  }

  if (!tabs.length && !headingText) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // the default tab: the source's active tab, else "All"
  if (tabs.length && !tabs.some((t) => t.active)) {
    const all = tabs.find((t) => /^all$/i.test(t.label));
    if (all) all.active = true;
  }

  const cells = [];
  if (headingText) {
    const h2 = document.createElement(headingEl ? headingEl.tagName.toLowerCase() : 'h2');
    h2.textContent = headingText;
    cells.push([h2]);
  }
  tabs.forEach(({ label, sub, active }) => {
    let labelNode = label;
    if (active) {
      labelNode = document.createElement('strong');
      labelNode.textContent = label;
    }
    cells.push([labelNode, sub || '']);
  });

  // the filter buttons are now part of the block; drop the source widget so they
  // are not imported a second time as default content
  if (wrap && tabs.length && !element.contains(wrap)) wrap.remove();

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-deployment', cells });
  element.replaceWith(block);
}
