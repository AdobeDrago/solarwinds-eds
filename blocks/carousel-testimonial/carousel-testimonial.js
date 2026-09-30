import { createOptimizedPicture } from '../../scripts/aem.js';

let instance = 0;

/**
 * True when an element's visible text is entirely made up of the given descendants' text.
 * @param {Element} el
 * @param {string} selector
 * @returns {boolean}
 */
function isOnly(el, selector) {
  const parts = [...el.querySelectorAll(selector)];
  if (!parts.length) return false;
  const strip = (s) => s.replace(/\s/g, '');
  return strip(el.textContent) === strip(parts.map((p) => p.textContent).join(''));
}

/**
 * Tag the quote card's parts: quote text, CTA link, and the attribution
 * (a bold name followed by title/company lines). Any part may be missing.
 * @param {Element} quote
 */
function structureQuote(quote) {
  const els = [...quote.children];
  const nameIndex = els.findIndex((el) => el.tagName === 'P' && isOnly(el, 'strong, b')
    && !el.querySelector('a'));

  els.forEach((el, i) => {
    if (el.querySelector('a') && isOnly(el, 'a')) el.classList.add('carousel-testimonial-cta');
    else if (nameIndex < 0 || i < nameIndex) el.classList.add('carousel-testimonial-text');
  });

  if (nameIndex < 0) return;
  const cite = document.createElement('div');
  cite.className = 'carousel-testimonial-cite';
  els[nameIndex].classList.add('carousel-testimonial-name');
  els[nameIndex].before(cite);
  els.slice(nameIndex).forEach((el, i) => {
    if (el.classList.contains('carousel-testimonial-cta')) return;
    if (i > 0) el.classList.add('carousel-testimonial-role');
    cite.append(el);
  });
}

/**
 * Build one slide from an authored row. The picture-only cell becomes the logo;
 * all other cells become the quote card. Cell order does not matter.
 * @param {Element} row
 * @param {number} index
 * @param {string} blockId
 * @returns {HTMLLIElement}
 */
function buildSlide(row, index, blockId) {
  const slide = document.createElement('li');
  slide.className = 'carousel-testimonial-slide';
  slide.id = `${blockId}-slide-${index}`;
  slide.dataset.slideIndex = index;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const quote = document.createElement('div');
  quote.className = 'carousel-testimonial-quote';
  const logo = document.createElement('div');
  logo.className = 'carousel-testimonial-logo';

  [...row.children].forEach((cell) => {
    const isLogo = cell.querySelector('picture') && !cell.textContent.trim();
    (isLogo ? logo : quote).append(...cell.childNodes);
  });

  logo.querySelectorAll('picture > img').forEach((img) => {
    // only http(s) sources can be resized; leave anything else (e.g. unresolved blob: refs) as-is
    if (!/^https?:$/.test(new URL(img.src, window.location.href).protocol)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]));
  });

  structureQuote(quote);

  slide.append(quote);
  if (logo.children.length) slide.append(logo);
  else slide.classList.add('carousel-testimonial-slide-no-logo');
  return slide;
}

/**
 * Carousel testimonial: rotating quote cards, each paired with a company logo.
 * Authored as one row per slide (col 1: logo image; col 2: quote, link, name, title, company).
 * @param {Element} block
 */
export default function decorate(block) {
  instance += 1;
  const blockId = `carousel-testimonial-${instance}`;
  block.id = blockId;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');

  const rows = [...block.children].filter((row) => row.children.length);
  const track = document.createElement('ul');
  track.className = 'carousel-testimonial-slides';
  const slides = rows.map((row, i) => buildSlide(row, i, blockId));
  track.append(...slides);

  const viewport = document.createElement('div');
  viewport.className = 'carousel-testimonial-viewport';
  viewport.append(track);
  block.replaceChildren(viewport);

  slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`));
  // the white logo circle is painted once by the block so logos can cross-fade over it
  if (slides.some((slide) => slide.querySelector('.carousel-testimonial-logo'))) {
    block.classList.add('carousel-testimonial-has-logo');
  }
  if (slides.length < 2) {
    block.classList.add('carousel-testimonial-single');
    return;
  }

  const controls = document.createElement('div');
  controls.className = 'carousel-testimonial-controls';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-testimonial-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-testimonial-next';
  next.setAttribute('aria-label', 'Next slide');

  const indicators = document.createElement('ol');
  indicators.className = 'carousel-testimonial-indicators';
  const dots = slides.map((slide, i) => {
    const li = document.createElement('li');
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-testimonial-indicator';
    dot.setAttribute('aria-label', `Show slide ${i + 1} of ${slides.length}`);
    dot.setAttribute('aria-controls', slide.id);
    li.append(dot);
    indicators.append(li);
    return dot;
  });

  controls.append(prev, indicators, next);
  block.append(controls);

  const last = slides.length - 1;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // the carousel does not wrap: the arrows are disabled at either end
  const updateArrows = (index) => {
    const focused = document.activeElement;
    prev.disabled = index === 0;
    next.disabled = index === last;
    // keep keyboard focus on a usable control when the focused arrow gets disabled
    if (focused === prev && prev.disabled) next.focus();
    if (focused === next && next.disabled) prev.focus();
  };

  let active = 0;
  const setActive = (index) => {
    active = index;
    block.dataset.activeSlide = index;
    updateArrows(index);
    slides.forEach((slide, i) => {
      const current = i === index;
      slide.setAttribute('aria-hidden', !current);
      slide.querySelectorAll('a, button').forEach((el) => {
        if (current) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
    });
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const goTo = (index) => {
    const target = Math.min(Math.max(index, 0), last);
    track.scrollTo({
      left: slides[target].offsetLeft - track.offsetLeft,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
    setActive(target);
  };

  prev.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // keep state in sync when the user swipes/scrolls the track directly
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(Number(entry.target.dataset.slideIndex));
    });
  }, { root: track, threshold: 0.6 });
  slides.forEach((slide) => observer.observe(slide));

  setActive(0);
}
