/**
 * Columns stats: a row of statistics, each a large value beside a short descriptor.
 * Authored as 1 row, N columns (each cell: bold number paragraph + descriptor text).
 * Extra rows are flattened into the same list; empty cells are dropped.
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'columns-stats-list';

  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (!cell.textContent.trim()) return;

    const item = document.createElement('li');
    item.className = 'columns-stats-item';
    const value = document.createElement('div');
    value.className = 'columns-stats-value';
    const label = document.createElement('div');
    label.className = 'columns-stats-label';

    const elements = [...cell.children];
    if (elements.length > 1) {
      value.append(elements[0]);
      label.append(...cell.childNodes);
    } else {
      // single paragraph: split the leading <strong> (the number) from the rest
      const holder = elements[0] || cell;
      const strong = holder.querySelector('strong, b');
      if (strong) {
        value.append(strong);
        label.append(...holder.childNodes);
      } else {
        value.append(...holder.childNodes);
      }
    }

    item.append(value);
    if (label.textContent.trim()) item.append(label);
    list.append(item);
  });

  block.replaceChildren(list);
}
