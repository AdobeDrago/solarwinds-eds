/* eslint-env node */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tokensDirectory = path.join(__dirname, 'tokens');
const metadata = JSON.parse(fs.readFileSync(path.join(tokensDirectory, '$metadata.json'), 'utf8'));

function flattenTokens(node, prefix = [], tokens = new Map()) {
  Object.entries(node).forEach(([key, value]) => {
    const tokenPath = [...prefix, key];
    if (value && Object.prototype.hasOwnProperty.call(value, 'value')) {
      tokens.set(tokenPath.join('.'), value);
    } else {
      flattenTokens(value, tokenPath, tokens);
    }
  });
  return tokens;
}

const tokens = new Map();
metadata.tokenSetOrder.forEach((setName) => {
  const source = JSON.parse(fs.readFileSync(path.join(tokensDirectory, `${setName}.json`), 'utf8'));
  flattenTokens(source, [], tokens);
});

function cssName(tokenPath) {
  return `--${tokenPath.replaceAll('.', '-')}`;
}

function replaceAliases(value) {
  return String(value).replace(/\{([^}]+)\}/g, (_, alias) => {
    if (!tokens.has(alias)) throw new Error(`Unknown token alias: ${alias}`);
    return `var(${cssName(alias)})`;
  });
}

function cssValue(token) {
  if (token.type === 'cubicBezier') return `cubic-bezier(${token.value.join(', ')})`;
  if (token.type === 'boxShadow') {
    const shadows = Array.isArray(token.value) ? token.value : [token.value];
    return shadows.map((shadow) => [
      shadow.type === 'innerShadow' ? 'inset' : '',
      shadow.x,
      shadow.y,
      shadow.blur,
      shadow.spread,
      replaceAliases(shadow.color),
    ].filter(Boolean).join(' ')).join(', ');
  }
  return replaceAliases(token.value);
}

const cssGroups = new Map();
tokens.forEach((token, tokenPath) => {
  const group = tokenPath.split('.')[0];
  if (!cssGroups.has(group)) cssGroups.set(group, []);
  cssGroups.get(group).push(`  ${cssName(tokenPath)}: ${cssValue(token)};`);
});

const css = [
  '/* Generated from design/tokens. Run `npm run tokens:build` after token changes. */',
  ':root {',
  ...[...cssGroups.entries()].flatMap(([group, declarations]) => [
    `  /* ${group} */`,
    ...declarations,
    '',
  ]),
  '}',
  '',
].join('\n');

function breakpointNumber(name) {
  const token = tokens.get(`breakpoint.${name}`);
  if (!token || !/^\d+px$/.test(token.value)) throw new Error(`Invalid breakpoint token: ${name}`);
  return Number.parseInt(token.value, 10);
}

const breakpointNames = ['fonts', 'blog-nav', 'desktop'];
const js = [
  '// Generated from design/tokens. Run `npm run tokens:build` after token changes.',
  'export const BREAKPOINTS = Object.freeze({',
  ...breakpointNames.map((name) => `  ${name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}: ${breakpointNumber(name)},`),
  '});',
  '',
  'export function minWidth(width) {',
  // eslint-disable-next-line no-template-curly-in-string
  '  return `(min-width: ${width}px)`;',
  '}',
  '',
].join('\n');

const outputs = [
  [path.join(__dirname, 'tokens.css'), css],
  [path.join(root, 'scripts', 'design-tokens.js'), js],
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function auditTokenUsage() {
  const errors = [];
  const cssFiles = [
    ...walk(path.join(root, 'blocks')),
    ...walk(path.join(root, 'styles')),
  ].filter((file) => file.endsWith('.css'));
  const color = /(?:#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\([^)]*\)|(?<![-\w])(?:white|black)(?![-\w]))/i;
  const dimension = /(?<![-\w])-?(\d*\.?\d+)(?:px|rem|em|ch|vw|vh|dvh)\b/g;

  cssFiles.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    [...source.matchAll(/([-\w]+)\s*:\s*([^;{}]+);/g)].forEach((declaration) => {
      const [, property, value] = declaration;
      if (color.test(value)) errors.push(`${path.relative(root, file)}: raw color in ${property}`);
      const rawDimensions = [...value.matchAll(dimension)]
        .filter((match) => Number.parseFloat(match[1]) !== 0);
      if (rawDimensions.length) errors.push(`${path.relative(root, file)}: raw dimension in ${property}`);
    });
  });

  const jsFiles = [
    ...walk(path.join(root, 'blocks')),
    ...walk(path.join(root, 'scripts')),
  ].filter((file) => file.endsWith('.js') && !file.endsWith('aem.js'));
  jsFiles.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    if (/matchMedia\(['"`]\(min-width:\s*\d+px/.test(source) || /innerWidth\s*[<>=]+\s*\d+/.test(source)) {
      errors.push(`${path.relative(root, file)}: raw JavaScript breakpoint`);
    }
  });

  if (errors.length) throw new Error(`Design token usage violations:\n${errors.join('\n')}`);
}

if (process.argv.includes('--check')) {
  const stale = outputs.filter(([file, contents]) => (
    !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== contents
  ));
  if (stale.length) {
    throw new Error(`Generated design token files are stale: ${stale.map(([file]) => path.relative(root, file)).join(', ')}`);
  }
  auditTokenUsage();
} else {
  outputs.forEach(([file, contents]) => fs.writeFileSync(file, contents));
}
