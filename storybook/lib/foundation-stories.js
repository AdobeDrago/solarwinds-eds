import globalTokens from '../../design/tokens/global';
import semanticTokens from '../../design/tokens/semantic';
import { page } from './aem-story.js';

function tokenEntries(node, prefix = []) {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = [...prefix, key];
    return value && Object.prototype.hasOwnProperty.call(value, 'value')
      ? [{ path: path.join('.'), ...value }]
      : tokenEntries(value, path);
  });
}

function tokenGrid(tokens, swatch) {
  const list = document.createElement('ul');
  list.className = 'storybook-token-grid';
  tokens.forEach((token) => {
    const item = document.createElement('li');
    item.className = 'storybook-token-card';
    if (swatch) {
      const sample = document.createElement('div');
      sample.className = 'storybook-token-swatch';
      sample.style.background = token.value;
      item.append(sample);
    }
    const details = document.createElement('div');
    details.className = 'storybook-token-details';
    const name = document.createElement('strong');
    name.textContent = token.path;
    const value = document.createElement('code');
    value.textContent = String(token.value);
    details.append(name, value);
    item.append(details);
    list.append(item);
  });
  return list;
}

export function renderColors() {
  const main = page('Color', 'Primitive and semantic colors come directly from the Tokens Studio dictionaries.');
  const primitives = tokenEntries(globalTokens.color);
  const semantic = tokenEntries(semanticTokens.color);
  main.append(tokenGrid([...primitives, ...semantic], true));
  return main;
}

export function renderTypography() {
  const main = page('Typography', 'SolarWinds typography uses the generated font-family, font-size, font-weight, and line-height tokens.');
  [
    ['Display', 'var(--font-family-display)', 'var(--font-size-48)', 'var(--font-weight-light)'],
    ['Heading', 'var(--font-family-heading)', 'var(--font-size-34)', 'var(--font-weight-bold)'],
    ['Body', 'var(--font-family-body)', 'var(--font-size-18)', 'var(--font-weight-regular)'],
    ['Button', 'var(--font-family-button)', 'var(--font-size-16)', 'var(--font-weight-semibold)'],
  ].forEach(([label, family, size, weight]) => {
    const sample = document.createElement('div');
    sample.className = 'storybook-type-sample';
    sample.style.fontFamily = family;
    sample.style.fontSize = size;
    sample.style.fontWeight = weight;
    sample.textContent = `${label}: See clearly, act decisively.`;
    main.append(sample);
  });
  return main;
}

export function renderSpacingAndSizing() {
  const main = page('Spacing and sizing', 'Spacing controls margins, padding, and gaps; sizing controls component dimensions.');
  const list = document.createElement('ul');
  list.className = 'storybook-scale';
  tokenEntries(globalTokens.space).filter((token) => /^\d+$/.test(token.path)).slice(0, 20)
    .forEach((token) => {
      const item = document.createElement('li');
      item.className = 'storybook-scale-item';
      const label = document.createElement('code');
      label.textContent = `space.${token.path}`;
      const bar = document.createElement('span');
      bar.className = 'storybook-scale-bar';
      bar.style.width = token.value;
      item.append(label, bar);
      list.append(item);
    });
  main.append(list);
  return main;
}

export function renderMotionAndElevation() {
  const main = page('Motion and elevation', 'Motion tokens define duration and easing. Elevation tokens define reusable surface depth.');
  tokenEntries(semanticTokens.elevation, ['elevation']).forEach((token) => {
    const sample = document.createElement('div');
    sample.className = 'storybook-elevation-sample';
    sample.style.boxShadow = `var(--${token.path.replaceAll('.', '-')})`;
    sample.innerHTML = `<h3>${token.path}</h3><p>Elevation is generated from the Tokens Studio box-shadow value.</p>`;
    main.append(sample);
  });
  return main;
}
