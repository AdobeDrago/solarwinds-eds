import {
  buildMeta, clearButtons, isPostTitle,
} from '../../scripts/blog.js';

/**
 * Turn one authored column into a topic: linked category heading, then a list of posts.
 * A post starts at each title (bold or linked paragraph, or heading); the paragraphs
 * after it (date, author, or one "date | author" paragraph) form its meta line.
 * @param {Element} cell
 * @returns {Element}
 */
function buildTopic(cell) {
  const topic = document.createElement('div');
  topic.className = 'columns-topics-topic';

  const els = [...cell.children].filter((el) => el.textContent.trim());
  // the topic heading is the first heading in the column
  const heading = els.find((el) => /^H[1-6]$/.test(el.tagName));
  const rest = heading ? els.slice(els.indexOf(heading) + 1) : els;
  const titles = rest.filter(isPostTitle);
  clearButtons(cell);

  if (heading) {
    heading.classList.add('columns-topics-heading');
    topic.append(heading);
  }

  const posts = [];
  rest.forEach((el) => {
    if (titles.includes(el) || !posts.length) posts.push({ title: el, meta: [] });
    else posts.at(-1).meta.push(el);
  });

  if (posts.length) {
    const ul = document.createElement('ul');
    ul.className = 'columns-topics-posts';
    posts.forEach(({ title, meta }) => {
      const li = document.createElement('li');
      li.className = 'columns-topics-post';
      title.classList.add('columns-topics-post-title');
      li.append(title);
      if (meta.length) li.append(buildMeta(meta, 'columns-topics'));
      ul.append(li);
    });
    topic.append(ul);
  }
  return topic;
}

/**
 * Columns topics: featured blog topics side by side. Each column has a linked
 * category heading and a short list of posts (title, date | author).
 * Authored as 1 row with one cell per topic; extra rows add more topics.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.flatMap((row) => [...row.children])
    .filter((cell) => cell.textContent.trim());
  const perRow = Math.max(1, ...rows.map((row) => row.children.length));
  block.style.setProperty('--columns-topics-cols', Math.min(perRow, 4));
  block.replaceChildren(...cells.map(buildTopic));
}
