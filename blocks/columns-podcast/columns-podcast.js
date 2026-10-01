import { createOptimizedPicture, loadScript } from '../../scripts/aem.js';
import {
  buildTerms, clearButtons, isImageCell, isTermsOnly,
} from '../../scripts/blog.js';
import { getWistiaId } from '../../scripts/wistia.js';

const WISTIA_PLAYER_JS = 'https://fast.wistia.com/player.js';
const PLAY_LABEL = 'Play episode';

/**
 * Replace a paragraph holding only a Wistia link with a player box. Until the player
 * loads, the box shows the link (episode title, or "Play episode" when the link text
 * is just the URL) as a play button; without JS, or if
 * Wistia fails, it stays a plain link to the episode.
 * @param {Element} content
 * @returns {Element|null} the player box
 */
function buildPlayer(content) {
  const link = [...content.querySelectorAll('a[href]')].find((a) => getWistiaId(a.href));
  if (!link) return null;
  const holder = link.closest('p') || link;
  if (holder !== link && holder.textContent.trim() !== link.textContent.trim()) return null;

  const player = document.createElement('div');
  player.className = 'columns-podcast-player';
  player.dataset.mediaId = getWistiaId(link.href);
  link.className = 'columns-podcast-fallback';
  link.removeAttribute('title');
  // a bare URL as link text (the importer's default) reads badly as a play button
  const text = link.textContent.trim();
  if (!text || /^(https?:)?\/\//i.test(text) || text === link.href) {
    link.textContent = PLAY_LABEL;
  }
  player.append(link);
  holder.replaceWith(player);
  return player;
}

/**
 * Load the Wistia player script and swap the fallback link for <wistia-player>.
 * Sized by its box (90px tall, set in the CSS), Wistia renders its compact audio bar.
 * @param {Element} player
 * @returns {Promise<void>}
 */
async function loadPlayer(player) {
  if (player.classList.contains('is-loading')) return;
  player.classList.add('is-loading');
  try {
    await loadScript(WISTIA_PLAYER_JS, { type: 'module' });
    const wistia = document.createElement('wistia-player');
    wistia.setAttribute('media-id', player.dataset.mediaId);
    wistia.setAttribute('swatch', 'false');
    wistia.addEventListener('loaded-media-data', () => player.classList.add('is-loaded'), { once: true });
    player.append(wistia);
  } catch {
    // keep the plain link
    player.classList.remove('is-loading');
    player.classList.add('is-failed');
  }
}

/**
 * Columns podcast: latest TechPod episode. Heading, Wistia audio player, tag pills and
 * date on one side, episode image on the other. Authored as 1 row, 2 cells (cell 1:
 * heading, Wistia link (episode title or the bare URL as text), tag links paragraph, date;
 * cell 2: image). The Wistia player loads only when the block nears the viewport or
 * the fallback is clicked.
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const imageCell = cells.find(isImageCell);

  const content = document.createElement('div');
  content.className = 'columns-podcast-content';
  cells.filter((cell) => cell !== imageCell).forEach((cell) => content.append(...cell.childNodes));
  clearButtons(content);

  const player = buildPlayer(content);

  // tag pills and the date share one line under the player
  const anchor = player || content.querySelector('h1, h2, h3, h4, h5, h6');
  const after = [];
  let next = anchor ? anchor.nextElementSibling : content.firstElementChild;
  while (next) {
    if (next.textContent.trim()) after.push(next);
    next = next.nextElementSibling;
  }
  const termEls = after.filter(isTermsOnly);
  const metaEls = after.filter((el) => termEls.includes(el) || !el.querySelector('a, picture'));
  if (metaEls.length) {
    const meta = document.createElement('div');
    meta.className = 'columns-podcast-meta';
    metaEls[0].before(meta);
    metaEls.forEach((el) => {
      if (termEls.includes(el)) {
        meta.append(buildTerms([el], 'columns-podcast'));
        el.remove();
      } else {
        el.classList.add('columns-podcast-date');
        meta.append(el);
      }
    });
  }

  const children = [content];
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    const media = document.createElement('div');
    media.className = 'columns-podcast-media';
    const img = picture.querySelector('img');
    media.append(picture.closest('a') || picture);
    media.querySelector('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
      { width: '750' },
    ]));
    children.push(media);
  } else {
    block.classList.add('columns-podcast-no-media');
  }
  block.replaceChildren(...children);

  if (!player) return;
  player.querySelector('.columns-podcast-fallback').addEventListener('click', (e) => {
    if (player.classList.contains('is-failed')) return;
    e.preventDefault();
    loadPlayer(player);
  });
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      loadPlayer(player);
    }
  }, { rootMargin: '200px 0px' });
  observer.observe(block);
}
