const blockModules = import.meta.glob([
  '../../blocks/*/*.js',
  '!../../blocks/footer/footer.js',
  '!../../blocks/fragment/fragment.js',
  '!../../blocks/header/header.js',
  '!../../blocks/hero/hero.js',
  '!../../blocks/section-metadata/section-metadata.js',
  '!../../blocks/widget/widget.js',
]);
const staticBlocks = new Set(['footer', 'fragment', 'header', 'hero', 'section-metadata']);

function toElement(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

function decorateFixtureButtons(root) {
  root.querySelectorAll('p > a[data-button]').forEach((link) => {
    const style = link.dataset.button || 'primary';
    link.classList.add('button', style);
    link.parentElement.classList.add('button-wrapper');
    delete link.dataset.button;
  });
}

export function page(title, description) {
  const main = document.createElement('main');
  main.className = 'storybook-page';
  const heading = document.createElement('h1');
  heading.textContent = title;
  const intro = document.createElement('p');
  intro.className = 'storybook-intro';
  intro.textContent = description;
  main.append(heading, intro);
  return main;
}

export function createBlockCanvas(name, fixture, variants = []) {
  const main = document.createElement('main');
  main.className = 'storybook-block-canvas';
  const section = document.createElement('div');
  section.className = `section ${name}-container`;
  const wrapper = document.createElement('div');
  wrapper.className = `${name}-wrapper`;
  const block = document.createElement('div');
  block.className = [name, ...variants, 'block'].join(' ');
  block.dataset.storyBlock = name;
  block.innerHTML = fixture;
  decorateFixtureButtons(block);
  wrapper.append(block);
  section.append(wrapper);
  main.append(section);
  return main;
}

async function decorateWidgetFixture(widget) {
  const source = widget.querySelector('a[href]');
  const url = new URL(source.href);
  const widgetName = url.pathname.split('/').at(-1).split('.')[0];
  const assetBase = `${window.location.origin}/widgets/${widgetName}`;
  widget.classList.add(widgetName);
  widget.classList.remove('block');
  widget.dataset.source = source.href;
  url.searchParams.forEach((value, key) => {
    widget.dataset[key] = value;
  });

  const response = await fetch(`${assetBase}.html`);
  if (!response.ok) throw new Error(`Unable to load Storybook widget fixture: ${response.status}`);
  widget.innerHTML = await response.text();

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = `${assetBase}.css`;
  document.head.append(stylesheet);

  // Vite must leave this runtime URL untouched, matching the production widget loader.
  const module = await import(/* @vite-ignore */ `${assetBase}.js`);
  if (module.default) await module.default(widget);
}

export async function decorateStoryBlock(canvasElement, name) {
  const block = canvasElement.querySelector(`[data-story-block="${name}"]`);
  if (!block || staticBlocks.has(name)) return;
  if (name === 'widget') {
    await decorateWidgetFixture(block);
    return;
  }
  const modulePath = `../../blocks/${name}/${name}.js`;
  const load = blockModules[modulePath];
  if (!load) throw new Error(`No decorator found for block: ${name}`);
  const module = await load();
  if (module.default) await module.default(block);
  block.dataset.blockStatus = 'loaded';
}

export function blockStory(name, fixture, options = {}) {
  const { variants = [], docs = '' } = options;
  return {
    parameters: {
      docs: {
        description: {
          story: docs || `Uses the repository's ${name} CSS and JavaScript decorator.`,
        },
      },
    },
    render: () => createBlockCanvas(name, fixture, variants),
    play: async ({ canvasElement }) => decorateStoryBlock(canvasElement, name),
  };
}

export function markupStory(title, description, markup) {
  return {
    render: () => {
      const main = page(title, description);
      main.append(toElement(markup));
      return main;
    },
  };
}
