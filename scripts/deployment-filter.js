/*
 * Deployment filter: shared state between the tabs-deployment control and the
 * blocks whose items it filters (cards-products, cards-tools).
 *
 * Blocks may decorate in any order: filterable blocks register themselves and
 * get the current filter applied immediately; the control sets the filter and
 * every registered block is re-filtered. A `deployment-filter:change` event is
 * dispatched on document so several controls on one page stay in sync.
 */
import { toClassName } from './aem.js';

export const DEPLOYMENT_FILTER_EVENT = 'deployment-filter:change';
export const DEPLOYMENT_ALL = 'all';

const HIDDEN_FLAG = 'deploymentHidden';

let current = DEPLOYMENT_ALL;
const registered = new Map();

/**
 * Normalize an authored deployment value into filter keys.
 * "SaaS" -> ['saas'], "SaaS / Self-Hosted" -> ['saas', 'self-hosted'].
 * @param {string} text
 * @returns {string[]}
 */
export function toDeploymentKeys(text) {
  return (text || '')
    .split(/,|\/|&|\band\b/i)
    .map((part) => toClassName(part.trim()))
    .filter(Boolean);
}

/**
 * Detect and remove a row's trailing data-only Deployment cell: the last of at
 * least two cells, holding only short plain text (no image, heading, list or link).
 * @param {Element[]} cells the row's cells (the array is shortened in place)
 * @returns {string[]} the deployment keys, or [] when the row has no such cell
 */
export function takeDeploymentCell(cells) {
  if (cells.length < 2) return [];
  const last = cells[cells.length - 1];
  const text = last.textContent.trim();
  if (!text || text.length > 40) return [];
  if (last.querySelector('picture, img, h1, h2, h3, h4, h5, h6, ul, ol, a')) return [];
  cells.pop();
  last.remove();
  return toDeploymentKeys(text);
}

/**
 * Hide or show an element, only ever un-hiding what this module hid.
 * @param {Element} el
 * @param {boolean} hide
 */
function toggle(el, hide) {
  if (hide) {
    if (el.hidden) return;
    el.hidden = true;
    el.dataset[HIDDEN_FLAG] = 'true';
  } else if (el.dataset[HIDDEN_FLAG]) {
    el.hidden = false;
    delete el.dataset[HIDDEN_FLAG];
  }
}

const LABEL_MAX_LENGTH = 60;

/**
 * True for a short label paragraph (e.g. "Database", "SolarWinds SaaS",
 * "<strong>Tools</strong>"): plain text, no link or media.
 * @param {Element} el
 * @returns {boolean}
 */
function isLabel(el) {
  if (el.tagName !== 'P') return false;
  const text = el.textContent.trim();
  return !!text && text.length <= LABEL_MAX_LENGTH
    && !el.querySelector('a, picture, img, video, iframe');
}

/**
 * The default content that introduces a block: the trailing elements of the
 * directly preceding default-content wrapper, walking back over short label
 * paragraphs and stopping at (and including) the nearest heading. Group titles
 * may be authored as headings or as plain paragraphs.
 * @param {Element} block
 * @returns {{ wrapper: Element|null, elements: Element[] }}
 */
function findIntro(block) {
  const blockWrapper = block.parentElement;
  const prev = blockWrapper?.previousElementSibling;
  if (!prev?.classList.contains('default-content-wrapper')) return { wrapper: null, elements: [] };
  const children = [...prev.children];
  let i = children.length;
  while (i > 0) {
    const el = children[i - 1];
    if (/^H[1-6]$/.test(el.tagName)) {
      i -= 1;
      break;
    }
    if (!isLabel(el)) break;
    i -= 1;
  }
  const elements = children.slice(i);
  if (!elements.length) return { wrapper: null, elements };
  return { wrapper: elements.length === children.length ? prev : null, elements };
}

/**
 * @param {string[]} keys
 * @returns {boolean}
 */
function matches(keys) {
  return current === DEPLOYMENT_ALL || !keys.length || keys.includes(current);
}

/**
 * Apply the current filter to one registered block.
 * @param {Element} block
 */
function applyToBlock(block) {
  const items = registered.get(block);
  if (!items) return;
  let visible = 0;
  items.forEach((item) => {
    const show = matches(toDeploymentKeys(item.dataset.deployment));
    toggle(item, !show);
    if (show) visible += 1;
  });

  const empty = items.length > 0 && visible === 0;
  const blockWrapper = block.parentElement;
  if (blockWrapper) toggle(blockWrapper, empty);
  const intro = findIntro(block);
  if (intro.wrapper) toggle(intro.wrapper, empty);
  else intro.elements.forEach((el) => toggle(el, empty));

  // a section left with nothing visible is hidden as well
  const section = block.closest('.section');
  if (section) {
    const allHidden = [...section.children].every((child) => child.hidden);
    toggle(section, allHidden);
  }
}

/**
 * Store an item's deployment keys on it (read by the filter).
 * @param {Element} item
 * @param {string[]} keys
 */
export function setItemDeployment(item, keys) {
  if (keys.length) item.dataset.deployment = keys.join(' / ');
}

/**
 * Register a block whose items can be filtered by deployment.
 * @param {Element} block
 * @param {Element[]} items elements carrying `data-deployment`
 */
export function registerFilterable(block, items) {
  registered.set(block, [...items]);
  applyToBlock(block);
}

/**
 * @returns {string} the active filter key
 */
export function getDeploymentFilter() {
  return current;
}

/**
 * Set the active filter and re-filter every registered block.
 * @param {string} key a deployment key, or DEPLOYMENT_ALL
 */
export function setDeploymentFilter(key) {
  const next = key || DEPLOYMENT_ALL;
  const changed = next !== current;
  current = next;
  registered.forEach((items, block) => {
    if (block.isConnected) applyToBlock(block);
    else registered.delete(block);
  });
  if (changed) {
    const detail = { filter: current };
    document.dispatchEvent(new CustomEvent(DEPLOYMENT_FILTER_EVENT, { detail }));
  }
}
