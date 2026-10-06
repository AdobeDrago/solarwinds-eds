const blockModules = import.meta.glob([
  '../../blocks/*/*.js',
  '!../../blocks/footer/footer.js',
  '!../../blocks/fragment/fragment.js',
  '!../../blocks/header/header.js',
  '!../../blocks/hero/hero.js',
  '!../../blocks/widget/widget.js',
], { eager: true });
const staticBlocks = new Set(['footer', 'fragment', 'header', 'hero']);

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

function fixtureControls(fixture, variants) {
  const template = document.createElement('template');
  template.innerHTML = fixture;
  const heading = template.content.querySelector('h1, h2, h3, h4, h5, h6');
  const body = [...template.content.querySelectorAll('p')].find((paragraph) => {
    const links = [...paragraph.querySelectorAll('a')];
    const linkText = links.map((link) => link.textContent).join('').trim();
    return paragraph.textContent.trim() && paragraph.textContent.trim() !== linkText;
  });
  const cta = template.content.querySelector('a[data-button]')
    || template.content.querySelector('a[href]');
  const hasMedia = !!template.content.querySelector('picture, img');
  const args = {
    blockOptions: variants.join(', '),
  };
  const argTypes = {
    blockOptions: {
      name: 'Block options',
      control: 'text',
      description: 'Comma-separated option classes applied to the block.',
    },
  };

  if (heading) {
    args.heading = heading.textContent.trim();
    argTypes.heading = {
      control: 'text',
      description: 'Text content of the first authored heading.',
    };
  }
  if (body) {
    args.body = body.textContent.trim();
    argTypes.body = {
      control: 'text',
      description: 'Text content of the first authored body paragraph.',
    };
  }
  if (cta) {
    args.ctaLabel = cta.textContent.trim();
    argTypes.ctaLabel = {
      name: 'CTA label',
      control: 'text',
      description: 'Text content of the first authored call-to-action link.',
    };
  }
  if (hasMedia) {
    args.showMedia = true;
    argTypes.showMedia = {
      name: 'Show media',
      control: 'boolean',
      description: 'Toggles authored picture and image elements.',
    };
  }

  return { args, argTypes };
}

function applyFixtureControls(block, args) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && typeof args.heading === 'string') heading.textContent = args.heading;

  const body = [...block.querySelectorAll('p')].find((paragraph) => {
    const links = [...paragraph.querySelectorAll('a')];
    const linkText = links.map((link) => link.textContent).join('').trim();
    return paragraph.textContent.trim() && paragraph.textContent.trim() !== linkText;
  });
  if (body && typeof args.body === 'string') body.textContent = args.body;

  const cta = block.querySelector('a[data-button]') || block.querySelector('a[href]');
  if (cta && typeof args.ctaLabel === 'string') cta.textContent = args.ctaLabel;

  if (args.showMedia === false) {
    block.querySelectorAll('picture, img').forEach((media) => media.remove());
  }
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

export function createBlockCanvas(
  name,
  fixture,
  variants = [],
  shouldDecorateButtons = true,
  args = {},
) {
  const main = document.createElement('main');
  main.className = 'storybook-block-canvas';
  const section = document.createElement('div');
  section.className = `section ${name}-container`;
  const wrapper = document.createElement('div');
  wrapper.className = `${name}-wrapper`;
  const block = document.createElement('div');
  const controlledOptions = typeof args.blockOptions === 'string'
    ? args.blockOptions.split(',').map((option) => option.trim()).filter(Boolean)
    : [];
  block.className = [...new Set([name, ...variants, ...controlledOptions, 'block'])].join(' ');
  block.dataset.storyBlock = name;
  block.innerHTML = fixture;
  applyFixtureControls(block, args);
  if (shouldDecorateButtons) decorateFixtureButtons(block);
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
  const module = blockModules[modulePath];
  if (!module) throw new Error(`No decorator found for block: ${name}`);
  if (module.default) await module.default(block);
  block.dataset.blockStatus = 'loaded';
}

export function blockStory(name, fixture, options = {}) {
  const { variants = [], docs = '' } = options;
  const controls = fixtureControls(fixture, variants);
  return {
    args: controls.args,
    argTypes: controls.argTypes,
    parameters: {
      docs: {
        description: {
          story: docs || `Uses the repository's ${name} CSS and JavaScript decorator.`,
        },
      },
    },
    render: (args) => {
      const canvas = createBlockCanvas(name, fixture, variants, true, args);
      decorateStoryBlock(canvas, name).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`Unable to decorate ${name} story`, error);
      });
      return canvas;
    },
  };
}

export function undecoratedBlockStory(name, fixture, options = {}) {
  const { variants = [] } = options;
  const controls = fixtureControls(fixture, variants);
  return {
    args: controls.args,
    argTypes: controls.argTypes,
    parameters: {
      docs: {
        description: {
          story: `Backend-style rows and cells before the ${name} block decorator runs.`,
        },
      },
    },
    render: (args) => createBlockCanvas(name, fixture, variants, false, args),
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
