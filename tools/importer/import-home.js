/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroSplitParser from './parsers/hero-split.js';
import columnsLogosParser from './parsers/columns-logos.js';
import tabsSolutionsParser from './parsers/tabs-solutions.js';
import heroBannerParser from './parsers/hero-banner.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import carouselTestimonialParser from './parsers/carousel-testimonial.js';
import columnsStatsParser from './parsers/columns-stats.js';
import columnsAwardsParser from './parsers/columns-awards.js';
import cardsResourcesParser from './parsers/cards-resources.js';

// TRANSFORMER IMPORTS
import solarwindsCleanupTransformer from './transformers/solarwinds-cleanup.js';
import solarwindsSectionsTransformer from './transformers/solarwinds-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-split': heroSplitParser,
  'columns-logos': columnsLogosParser,
  'tabs-solutions': tabsSolutionsParser,
  'hero-banner': heroBannerParser,
  'cards-feature': cardsFeatureParser,
  'carousel-testimonial': carouselTestimonialParser,
  'columns-stats': columnsStatsParser,
  'columns-awards': columnsAwardsParser,
  'cards-resources': cardsResourcesParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
// Builder.io A/B test: variant A (.a-53874) is migrated; the cleanup transformer
// removes variant B (.b-53874) before parsing.
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'SolarWinds homepage (Builder.io). The page ships two A/B variants in the DOM: variant A wrappers carry class .a-53874, variant B wrappers carry .b-53874 and the inactive one is hidden via CSS. Migrate variant A: cleanup must remove every .b-53874 element before parsing.',
  urls: [
    'https://www.solarwinds.com/',
  ],
  blocks: [
    { name: 'hero-split', instances: ['.builder-5e8ffb11e27245fb9426cd6bbe299166'] },
    { name: 'columns-logos', instances: ['.builder-23fd21cbbb5146eca6ea23014dd592ce'] },
    { name: 'tabs-solutions', instances: ['.builder-938ec099cb994c228ea38e253fe88027'] },
    { name: 'hero-banner', instances: ['.builder-c61cb09d9e344c588de162c4e9a3e93b'] },
    { name: 'cards-feature', instances: ['.builder-0e539bc39f9440efa8b9c7d3ea57e375'] },
    { name: 'carousel-testimonial', instances: ['.builder-dbd3271aa0a64dda81d871bbb526ac44'] },
    { name: 'columns-stats', instances: ['.builder-11494af395b74565b682f095dd7dc4ad'] },
    { name: 'columns-awards', instances: ['.builder-69539e951525462794cee442e22436ab'] },
    { name: 'cards-resources', instances: ['.builder-d8f426a8e5b04a61a320ccb11792acf7'] },
  ],
  sections: [
    {
      id: '1',
      name: 'hero',
      selector: ['section.builder-5e8ffb11e27245fb9426cd6bbe299166'],
      style: null,
      blocks: ['hero-split'],
      defaultContent: [],
    },
    {
      id: '2',
      name: 'customer-logos',
      selector: ['section.builder-23fd21cbbb5146eca6ea23014dd592ce'],
      style: 'light-teal',
      blocks: ['columns-logos'],
      defaultContent: [],
    },
    {
      id: '3',
      name: 'solutions-tabs',
      selector: ['section.builder-12d9733bed1a4281bad8e0d5c6f75939'],
      style: null,
      blocks: ['tabs-solutions'],
      defaultContent: ['.builder-0d7ee48204e645bc93ece752e3f677f5'],
    },
    {
      id: '4',
      name: 'contact-cta',
      selector: ['section.builder-c61cb09d9e344c588de162c4e9a3e93b'],
      style: null,
      blocks: ['hero-banner'],
      defaultContent: [],
    },
    {
      id: '5',
      name: 'ai-resources',
      selector: ['section.builder-cb406aab14a64cb6bccbf9d322efe7d2'],
      style: 'dark',
      blocks: ['cards-feature'],
      defaultContent: ['.builder-deeb6d31d4cd4d8aa0ccbf9c9163828b'],
    },
    {
      id: '6',
      name: 'testimonials',
      selector: ['section.builder-01046a9d32dc4f4281fe5a4800283564'],
      style: 'teal',
      blocks: ['carousel-testimonial'],
      defaultContent: ['.builder-e90ffb7b51c043bc8082f3451ab6d682'],
    },
    {
      id: '7',
      name: 'stats',
      selector: ['section.builder-11494af395b74565b682f095dd7dc4ad'],
      style: null,
      blocks: ['columns-stats'],
      defaultContent: [],
    },
    {
      id: '8',
      name: 'awards',
      selector: ['.builder-985226446bcd44af9653024d75fc2305', 'section.builder-69539e951525462794cee442e22436ab'],
      style: null,
      blocks: ['columns-awards'],
      defaultContent: [],
    },
    {
      id: '9',
      name: 'resources',
      selector: ['section.builder-9f6ff11230044ad591518e5d74567018'],
      style: 'light-grey',
      blocks: ['cards-resources'],
      defaultContent: ['.builder-2adb95ecd59f402b912f4cdc1834fe76'],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup first so variant B is gone before section markers are placed
const transformers = [
  solarwindsCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [solarwindsSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup (removes variant B, scripts, styles, tracking) + section markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by an earlier parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup (header/footer removal) + section breaks and section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; the root URL maps to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
