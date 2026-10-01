import { registerFilterable, setItemDeployment, takeDeploymentCell } from '../../scripts/deployment-filter.js';
import { decorateOffer, isImageCell, optimizeIcon } from '../../scripts/pricing-offer.js';

/**
 * Group the CTA row with its trial note: the note ("Fully functional for 30 days")
 * sits under the primary button, the other buttons beside them. The CTA paragraph
 * becomes a div, as it now holds the note paragraph.
 * @param {Element} offer the decorated offer cell
 */
function groupCta(offer) {
  const cta = offer.querySelector(':scope > .cards-products-cta');
  if (!cta) return;
  const actions = document.createElement('div');
  actions.className = 'cards-products-cta';
  const next = cta.nextElementSibling;
  const trial = next?.classList.contains('cards-products-trial') ? next : null;
  let trialPlaced = false;
  [...cta.querySelectorAll('a.button')].forEach((a) => {
    if (trial && !trialPlaced && a.classList.contains('primary')) {
      const group = document.createElement('div');
      group.className = 'cards-products-trial-group';
      group.append(a, trial);
      actions.append(group);
      trialPlaced = true;
    } else actions.append(a);
  });
  cta.replaceWith(actions);
}

/**
 * Cards products: full-width product rows grouped under a category heading
 * (default content before the block).
 * Authored as one row per product: icon | offer (H3 name, optional tag, bold
 * price, notes, "Get a Quote" link, bold trial link + italic "Quick View" link,
 * trial note) | details (bold intro + bullets) | Deployment ("SaaS" /
 * "Self-Hosted"). The Deployment cell is data for the tabs-deployment filter
 * and is not rendered. Cells are identified by content, so any may be omitted.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-products-list';
  const items = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const deployment = takeDeploymentCell(cells);
    if (!cells.some((cell) => cell.textContent.trim() || cell.querySelector('picture'))) return;

    const li = document.createElement('li');
    li.className = 'cards-products-item';
    setItemDeployment(li, deployment);

    const iconCell = cells.find(isImageCell);
    const textCells = cells.filter((cell) => cell !== iconCell);
    const offerCell = textCells.find((cell) => cell.querySelector('h1, h2, h3, h4, h5, h6'))
      || textCells[0];
    const detailCells = textCells.filter((cell) => cell !== offerCell);

    if (iconCell) {
      iconCell.className = 'cards-products-icon';
      optimizeIcon(iconCell);
      li.append(iconCell);
    } else {
      li.classList.add('cards-products-item-no-icon');
    }

    if (offerCell) {
      offerCell.className = 'cards-products-offer';
      decorateOffer(offerCell, 'cards-products');
      groupCta(offerCell);
      li.append(offerCell);
    }

    if (detailCells.length) {
      const details = document.createElement('div');
      details.className = 'cards-products-details';
      detailCells.forEach((cell) => details.append(...cell.childNodes));
      const intro = details.querySelector(':scope > p');
      if (intro && intro === details.firstElementChild) intro.classList.add('cards-products-intro');
      details.querySelectorAll(':scope > ul').forEach((list) => list.classList.add('cards-products-bullets'));
      li.append(details);
    }

    ul.append(li);
    items.push(li);
  });

  block.replaceChildren(ul);
  registerFilterable(block, items);
}
