/**
 * True when a paragraph holds nothing but one or more links.
 * @param {Element} p
 * @returns {boolean}
 */
function isLinkOnly(p) {
  const links = [...p.querySelectorAll('a[href]')];
  if (!links.length) return false;
  const linkText = links.map((a) => a.textContent).join('').replace(/\s/g, '');
  return linkText === p.textContent.replace(/\s/g, '');
}

/**
 * Split an authored price ("$142") into a superscript currency and the amount.
 * @param {Element} strong
 */
function decoratePrice(strong) {
  const match = strong.textContent.trim().match(/^([^\d\s]*)\s*(\d[\d.,]*)(.*)$/);
  if (!match) return;
  const [, currency, amount, rest] = match;
  strong.textContent = '';
  if (currency) {
    const sup = document.createElement('sup');
    sup.className = 'cards-pricing-currency';
    sup.textContent = currency;
    strong.append(sup);
  }
  const value = document.createElement('span');
  value.className = 'cards-pricing-amount';
  value.textContent = amount;
  strong.append(value);
  if (rest.trim()) strong.append(rest);
}

/**
 * Cards pricing: a row of pricing tier cards.
 * Authored as one row per card with one cell: H3 tier name, "Starts at:",
 * the price in bold ("<strong>$8</strong>"), a unit line, a CTA link and a
 * bullet list. Extra cells are merged into the card body; every part is optional.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-pricing-list';

  [...block.children].forEach((row) => {
    const body = document.createElement('div');
    body.className = 'cards-pricing-card-body';
    [...row.children].forEach((cell) => body.append(...cell.childNodes));
    if (!body.textContent.trim() && !body.querySelector('picture')) return;

    const li = document.createElement('li');
    li.className = 'cards-pricing-card';

    // the first heading is the tier name, shown as the card's header strip
    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const header = document.createElement('div');
      header.className = 'cards-pricing-card-header';
      header.append(heading);
      li.append(header);
    }

    // the price is a paragraph holding only bold text (no link)
    const paragraphs = [...body.querySelectorAll(':scope > p')];
    const price = paragraphs.find((p) => {
      const strong = p.querySelector('strong, b');
      return strong && !p.querySelector('a')
        && strong.textContent.trim() === p.textContent.trim() && /\d/.test(p.textContent);
    });
    if (price) {
      price.classList.add('cards-pricing-price');
      decoratePrice(price.querySelector('strong, b'));
      const label = price.previousElementSibling;
      if (label?.tagName === 'P' && !isLinkOnly(label)) label.classList.add('cards-pricing-label');
      const unit = price.nextElementSibling;
      if (unit?.tagName === 'P' && !isLinkOnly(unit)) unit.classList.add('cards-pricing-unit');
    }

    paragraphs.filter(isLinkOnly).forEach((p) => {
      p.className = 'cards-pricing-cta';
      p.querySelectorAll('a[href]').forEach((a) => {
        if (!a.classList.contains('button')) a.classList.add('button', 'primary');
      });
    });

    body.querySelectorAll(':scope > ul').forEach((list) => list.classList.add('cards-pricing-features'));

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
