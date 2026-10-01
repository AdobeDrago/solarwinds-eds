import { registerFilterable, setItemDeployment, takeDeploymentCell } from '../../scripts/deployment-filter.js';
import { decorateOffer, isImageCell, optimizeIcon } from '../../scripts/pricing-offer.js';

/**
 * Group the CTA row with its trial note: the note ("Fully functional for 14 days")
 * sits centred under the primary button, the other buttons beside them. The CTA
 * paragraph becomes a div, as it now holds the note paragraph.
 * @param {Element} offer the decorated offer cell
 */
function groupCta(offer) {
  const cta = offer.querySelector(':scope > .cards-tools-cta');
  if (!cta) return;
  const actions = document.createElement('div');
  actions.className = 'cards-tools-cta';
  const next = cta.nextElementSibling;
  const trial = next?.classList.contains('cards-tools-trial') ? next : null;
  let trialPlaced = false;
  [...cta.querySelectorAll('a.button')].forEach((a) => {
    if (trial && !trialPlaced && a.classList.contains('primary')) {
      const group = document.createElement('div');
      group.className = 'cards-tools-trial-group';
      group.append(a, trial);
      actions.append(group);
      trialPlaced = true;
    } else actions.append(a);
  });
  cta.replaceWith(actions);
}

/**
 * Cards tools: a grid of compact tool cards (icon over name, price and CTAs).
 * Authored as one row per tool: icon | offer (H3 name, bold price, optional
 * note, "Get a Quote" link, bold trial link + italic "Quick View" link, trial
 * note) | Deployment ("SaaS" / "Self-Hosted"). The Deployment cell is data for
 * the tabs-deployment filter and is not rendered. Extra text cells are merged
 * into the offer; the icon may be omitted.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-tools-list';
  const items = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const deployment = takeDeploymentCell(cells);
    if (!cells.some((cell) => cell.textContent.trim() || cell.querySelector('picture'))) return;

    const li = document.createElement('li');
    li.className = 'cards-tools-card';
    setItemDeployment(li, deployment);

    const iconCell = cells.find(isImageCell);
    if (iconCell) {
      iconCell.className = 'cards-tools-icon';
      optimizeIcon(iconCell);
      li.append(iconCell);
    }

    const offer = document.createElement('div');
    offer.className = 'cards-tools-offer';
    cells.filter((cell) => cell !== iconCell).forEach((cell) => offer.append(...cell.childNodes));
    decorateOffer(offer, 'cards-tools');
    groupCta(offer);
    li.append(offer);

    ul.append(li);
    items.push(li);
  });

  block.replaceChildren(ul);
  registerFilterable(block, items);
}
