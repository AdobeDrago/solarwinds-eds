import { toClassName } from '../../scripts/aem.js';
import { getWistiaId } from '../../scripts/wistia.js';

let instance = 0;

/* the illustration is a 4-slice pie: slice n belongs to tab n (authored order) */
const PIE_SLICES = 4;

const WISTIA_PARAMS = new URLSearchParams({
  autoPlay: 'true',
  muted: 'true',
  endVideoBehavior: 'loop',
  silentAutoPlay: 'allow',
  playbar: 'true',
  fullscreenButton: 'true',
  volumeControl: 'false',
  settingsControl: 'false',
  playButton: 'false',
  smallPlayButton: 'true',
});

/**
 * Replace a paragraph holding only a Wistia link with a (lazily filled) player box.
 * Any other link is left alone.
 * @param {Element} body
 */
function decorateVideo(body) {
  const link = [...body.querySelectorAll('a[href]')].find((a) => getWistiaId(a.href));
  if (!link) return;
  const holder = link.closest('p') || link;
  if (holder !== link && holder.textContent.trim() !== link.textContent.trim()) return;
  const video = document.createElement('div');
  video.className = 'tabs-solutions-video';
  video.dataset.videoId = getWistiaId(link.href);
  video.dataset.videoTitle = link.textContent.trim() || link.title || 'Video';
  holder.replaceWith(video);
}

/**
 * Create the Wistia iframe for a panel the first time it is shown.
 * @param {Element} panel
 */
function loadVideo(panel) {
  const video = panel.querySelector('.tabs-solutions-video[data-video-id]:not(.is-loaded)');
  if (!video) return;
  const iframe = document.createElement('iframe');
  iframe.src = `https://fast.wistia.net/embed/iframe/${video.dataset.videoId}?${WISTIA_PARAMS}`;
  iframe.title = video.dataset.videoTitle;
  iframe.allow = 'autoplay; fullscreen';
  iframe.loading = 'lazy';
  video.append(iframe);
  video.classList.add('is-loaded');
}

/**
 * Split a panel cell into its icon (first picture, used by the pie) and body.
 * @param {Element} cell
 * @returns {{ body: Element, icon: Element|null }}
 */
function buildPanelContent(cell) {
  // the icon is the cell's leading picture (bare or alone in a paragraph)
  const lead = cell.firstElementChild;
  let icon = lead?.matches('picture') ? lead : lead?.querySelector(':scope > picture');
  if (icon && (icon === lead || !lead.textContent.trim())) {
    lead.remove();
    icon.remove();
  } else {
    icon = null;
  }

  const body = document.createElement('div');
  body.className = 'tabs-solutions-body';
  [...cell.childNodes].forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE || node.textContent.trim()) body.append(node);
  });

  decorateVideo(body);
  body.querySelectorAll('ul, ol').forEach((list) => list.classList.add('tabs-solutions-links'));
  return { body, icon };
}

/**
 * The shared, decorative pie illustration (one slice per tab).
 * @param {(Element|null)[]} icons tab icons, in tab order
 * @returns {Element}
 */
function buildPie(icons) {
  const base = `${window.hlx?.codeBasePath || ''}/blocks/tabs-solutions`;
  const pie = document.createElement('div');
  pie.className = 'tabs-solutions-pie';
  pie.setAttribute('aria-hidden', 'true');

  icons.forEach((icon, i) => {
    const slice = document.createElement('div');
    slice.className = `tabs-solutions-slice tabs-solutions-slice-${i + 1}`;
    ['base', 'active'].forEach((state) => {
      const img = document.createElement('img');
      img.className = `tabs-solutions-slice-${state === 'base' ? 'shape' : 'highlight'}`;
      img.src = `${base}/pie-${i + 1}-${state}.svg`;
      img.alt = '';
      img.loading = 'lazy';
      slice.append(img);
    });
    if (icon) {
      const wrap = document.createElement('span');
      wrap.className = 'tabs-solutions-slice-icon';
      const img = icon.querySelector('img');
      if (img) {
        img.alt = '';
        img.loading = 'lazy'; // the pie is hidden on small screens
      }
      wrap.append(icon);
      slice.append(wrap);
    }
    pie.append(slice);
  });
  return pie;
}

/**
 * Shape-accurate hit testing for the overlapping slice images: the topmost
 * slice whose base SVG is opaque under the pointer.
 * @param {Element[]} slices
 * @returns {(x: number, y: number) => number} slice index or -1
 */
function createHitTester(slices) {
  const canvases = new Map();
  const alphaAt = (img, x, y) => {
    if (!img.complete || !img.naturalWidth) return 0;
    let ctx = canvases.get(img);
    if (!ctx) {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvases.set(img, ctx);
    }
    try {
      return ctx.getImageData(x, y, 1, 1).data[3];
    } catch {
      return 255; // unreadable canvas: fall back to the image box
    }
  };

  return (clientX, clientY) => {
    for (let i = slices.length - 1; i >= 0; i -= 1) {
      const img = slices[i].querySelector('.tabs-solutions-slice-shape');
      const rect = img.getBoundingClientRect();
      if (rect.width && clientX >= rect.left && clientX < rect.right
        && clientY >= rect.top && clientY < rect.bottom) {
        const x = Math.floor(((clientX - rect.left) * img.naturalWidth) / rect.width);
        const y = Math.floor(((clientY - rect.top) * img.naturalHeight) / rect.height);
        if (alphaAt(img, x, y) > 0) return i;
      }
    }
    return -1;
  };
}

/**
 * Dropdown alternative to the tab list: a button showing the current tab that opens a
 * listbox of all tabs. Hidden by default; the CSS shows it instead of the tab list
 * where the source collapses its tabs into a dropdown (small screens, French site).
 * @param {string[]} labels tab labels, in tab order
 * @param {(index: number) => void} onPick called with the chosen tab's index
 * @returns {{ picker: Element, update: (index: number) => void }}
 */
function buildPicker(labels, onPick) {
  const picker = document.createElement('div');
  picker.className = 'tabs-solutions-picker';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tabs-solutions-picker-button';
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  const current = document.createElement('span');
  current.className = 'tabs-solutions-picker-label';
  button.append(current);

  const list = document.createElement('ul');
  list.className = 'tabs-solutions-picker-options';
  list.id = `tabs-solutions-picker-${instance}`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  button.setAttribute('aria-controls', list.id);

  let selected = 0;
  const options = labels.map((label) => {
    const option = document.createElement('li');
    option.className = 'tabs-solutions-picker-option';
    option.setAttribute('role', 'option');
    option.tabIndex = -1;
    option.textContent = label;
    list.append(option);
    return option;
  });

  const onOutside = (e) => {
    // eslint-disable-next-line no-use-before-define
    if (!picker.contains(e.target)) close(false);
  };

  function close(focusButton) {
    if (list.hidden) return;
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside);
    if (focusButton) button.focus();
  }

  const open = () => {
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', onOutside);
    options[selected].focus();
  };

  const pick = (index) => {
    close(true);
    onPick(index);
  };

  button.addEventListener('click', () => (list.hidden ? open() : close(false)));
  button.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open();
    }
  });
  options.forEach((option, i) => option.addEventListener('click', () => pick(i)));
  list.addEventListener('keydown', (e) => {
    const focused = options.indexOf(document.activeElement);
    const moves = {
      ArrowDown: Math.min(focused + 1, options.length - 1),
      ArrowUp: Math.max(focused - 1, 0),
      Home: 0,
      End: options.length - 1,
    };
    if (e.key in moves) {
      e.preventDefault();
      options[moves[e.key]].focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && focused >= 0) {
      e.preventDefault();
      pick(focused);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    }
  });

  picker.append(button, list);

  const update = (index) => {
    selected = index;
    current.textContent = labels[index];
    options.forEach((option, i) => option.setAttribute('aria-selected', i === index));
  };
  return { picker, update };
}

/**
 * Tabs solutions: tab labels above a shared pie illustration and per-tab panels
 * (loop video, text, CTA, link list).
 * Authored as rows of 2 cells (col 1: tab label, col 2: panel content).
 * @param {Element} block
 */
export default function decorate(block) {
  instance += 1;
  const tablist = document.createElement('div');
  tablist.className = 'tabs-solutions-list';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'tabs-solutions-panels';

  const rows = [...block.children].filter((row) => row.children.length);
  const buttons = [];
  const panelEls = [];
  const icons = [];
  const labels = [];
  let slices = [];
  let picker = null;
  let videosEnabled = false;
  let current = 0;

  const select = (index, focus = false) => {
    current = index;
    picker?.update(index);
    buttons.forEach((btn, i) => {
      const active = i === index;
      btn.setAttribute('aria-selected', active);
      btn.tabIndex = active ? 0 : -1;
      panelEls[i].setAttribute('aria-hidden', !active);
      panelEls[i].hidden = !active;
      slices[i]?.classList.toggle('is-selected', active);
    });
    if (videosEnabled) loadVideo(panelEls[index]);
    if (focus) buttons[index].focus();
  };

  // a click means the block is on screen: load that panel's video right away
  const activate = (index) => {
    videosEnabled = true;
    select(index);
  };

  rows.forEach((row, i) => {
    const [labelCell, ...rest] = [...row.children];
    const label = labelCell.textContent.trim() || `Tab ${i + 1}`;
    labels.push(label);
    const id = `${toClassName(label) || 'tab'}-${instance}-${i}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-solutions-tab';
    button.id = `tab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    // text-only cells arrive wrapped in a <p>; a button may only hold phrasing content
    const only = labelCell.children.length === 1 ? labelCell.firstElementChild : null;
    const source = only && only.matches('p, h1, h2, h3, h4, h5, h6') ? only : labelCell;
    if (source.querySelector('p, div, ul, ol, h1, h2, h3, h4, h5, h6, picture') || !source.innerHTML.trim()) {
      button.textContent = label;
    } else {
      button.innerHTML = source.innerHTML;
    }
    button.addEventListener('click', () => activate(i));
    tablist.append(button);
    buttons.push(button);

    const panel = document.createElement('div');
    panel.className = 'tabs-solutions-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    const content = document.createElement('div');
    rest.forEach((cell) => content.append(...cell.childNodes));
    const { body, icon } = buildPanelContent(content);
    panel.append(body);
    panels.append(panel);
    panelEls.push(panel);
    icons.push(icon);
  });

  tablist.addEventListener('keydown', (e) => {
    const focused = buttons.indexOf(document.activeElement);
    if (focused < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = (focused + 1) % buttons.length;
    if (e.key === 'ArrowLeft') next = (focused - 1 + buttons.length) % buttons.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = buttons.length - 1;
    if (next !== null) {
      e.preventDefault();
      videosEnabled = true;
      select(next, true);
    }
  });

  const stage = document.createElement('div');
  stage.className = 'tabs-solutions-stage';

  // the pie has exactly one slice per tab, so it is only drawn for a 4-tab block
  if (rows.length === PIE_SLICES) {
    const illustration = document.createElement('div');
    illustration.className = 'tabs-solutions-illustration';
    const pie = buildPie(icons);
    illustration.append(pie);
    stage.append(illustration);
    slices = [...pie.children];

    const hitTest = createHitTester(slices);
    let hovered = -1;
    const setHover = (index) => {
      if (index === hovered) return;
      slices[hovered]?.classList.remove('is-hover');
      slices[index]?.classList.add('is-hover');
      pie.classList.toggle('is-pointer', index >= 0);
      hovered = index;
    };
    pie.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') setHover(hitTest(e.clientX, e.clientY));
    });
    pie.addEventListener('pointerleave', () => setHover(-1));
    pie.addEventListener('click', (e) => {
      const index = hitTest(e.clientX, e.clientY);
      if (index >= 0 && index !== current) activate(index);
    });

    // slices fly in and assemble the first time the illustration scrolls into view
    const assemble = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        pie.classList.add('tabs-solutions-pie-assembled');
        assemble.disconnect();
      }
    }, { threshold: 0.25 });
    assemble.observe(illustration);
  } else {
    stage.classList.add('tabs-solutions-no-illustration');
  }
  stage.append(panels);

  picker = buildPicker(labels, activate);
  block.replaceChildren(tablist, picker.picker, stage);
  if (buttons.length) select(0);

  // keep the first video out of the critical path: load it once the block is on screen
  const reveal = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      reveal.disconnect();
      videosEnabled = true;
      loadVideo(panelEls[current]);
    }
  });
  reveal.observe(block);
}
