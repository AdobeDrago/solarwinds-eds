import { toClassName } from '../../scripts/aem.js';
import {
  DEPLOYMENT_ALL,
  DEPLOYMENT_FILTER_EVENT,
  getDeploymentFilter,
  setDeploymentFilter,
  toDeploymentKeys,
} from '../../scripts/deployment-filter.js';

/**
 * A row is the optional heading row when it is the first row, has a single
 * cell and other rows follow it.
 * @param {Element} row
 * @param {number} index
 * @param {number} count
 * @returns {boolean}
 */
function isHeadingRow(row, index, count) {
  return index === 0 && count > 1 && row.children.length === 1;
}

/**
 * Build the heading element from the heading row, keeping an authored heading tag.
 * @param {Element} cell
 * @returns {Element|null}
 */
function buildHeading(cell) {
  if (!cell.textContent.trim()) return null;
  const authored = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const heading = authored || document.createElement('p');
  if (!authored) heading.append(...cell.childNodes);
  heading.classList.add('tabs-deployment-heading');
  return heading;
}

/**
 * Tabs deployment: a panel-less, segmented filter control. Selecting a tab
 * filters the items of the deployment-aware blocks on the page (cards-products,
 * cards-tools) by their Deployment value; "All" shows everything.
 * Authored as an optional one-cell heading row, then one row per tab:
 * label (the filter key, e.g. SaaS / All / Self-Hosted) | optional sub-label.
 * The default tab is the one whose label is bold, else "All", else the first.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  let heading = null;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-deployment-list';
  tablist.setAttribute('role', 'tablist');

  const tabs = [];
  let defaultTab = null;

  rows.forEach((row, i) => {
    const cells = [...row.children];
    if (isHeadingRow(row, i, rows.length)) {
      heading = buildHeading(cells[0]);
      return;
    }
    const [labelCell, subCell] = cells;
    const labelText = labelCell?.textContent.trim();
    if (!labelText) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-deployment-tab';
    tab.setAttribute('role', 'tab');
    const key = toDeploymentKeys(labelText)[0] || toClassName(labelText);
    tab.dataset.filter = key;

    const label = document.createElement('span');
    label.className = 'tabs-deployment-label';
    label.textContent = labelText;
    tab.append(label);

    const subText = subCell?.textContent.trim();
    if (subText) {
      const sub = document.createElement('span');
      sub.className = 'tabs-deployment-sublabel';
      sub.textContent = subText;
      tab.append(sub);
    }

    if (!defaultTab && labelCell.querySelector('strong, b')) defaultTab = tab;
    tabs.push(tab);
    tablist.append(tab);
  });

  if (!tabs.length) {
    block.replaceChildren(...(heading ? [heading] : []));
    return;
  }

  if (heading) {
    if (!heading.id) heading.id = `tabs-deployment-heading-${toClassName(heading.textContent)}`;
    tablist.setAttribute('aria-labelledby', heading.id);
  } else {
    tablist.setAttribute('aria-label', 'Filter by deployment');
  }

  /**
   * Reflect a filter key on the tabs (aria-selected, roving tabindex).
   * @param {string} key
   */
  const reflect = (key) => {
    const active = tabs.find((t) => t.dataset.filter === key)
      || tabs.find((t) => t.dataset.filter === DEPLOYMENT_ALL);
    tabs.forEach((t) => {
      const selected = t === active;
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.tabIndex = selected || (!active && t === tabs[0]) ? 0 : -1;
    });
  };

  /**
   * @param {Element} tab
   */
  const select = (tab) => {
    reflect(tab.dataset.filter);
    setDeploymentFilter(tab.dataset.filter);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') [next] = tabs;
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      next.focus();
      select(next);
    });
  });

  // keep in sync with other filter controls on the page
  document.addEventListener(DEPLOYMENT_FILTER_EVENT, (e) => reflect(e.detail.filter));

  block.replaceChildren(...(heading ? [heading] : []), tablist);

  defaultTab = defaultTab
    || tabs.find((t) => t.dataset.filter === DEPLOYMENT_ALL)
    || tabs[0];
  // a filter already chosen on the page (another control) wins over the default
  const currentKey = getDeploymentFilter();
  if (currentKey !== DEPLOYMENT_ALL && tabs.some((t) => t.dataset.filter === currentKey)) {
    reflect(currentKey);
  } else {
    select(defaultTab);
  }
}
