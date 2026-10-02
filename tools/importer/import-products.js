/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsCatalogParser from './parsers/cards-catalog.js';
import columnsLogosParser from './parsers/columns-logos.js';
import heroBannerParser from './parsers/hero-banner.js';

// TRANSFORMER IMPORTS
import solarwindsCleanupTransformer from './transformers/solarwinds-cleanup.js';
import solarwindsProductsCleanupTransformer from './transformers/solarwinds-products-cleanup.js';
import solarwindsSectionsTransformer from './transformers/solarwinds-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-catalog': cardsCatalogParser,
  'columns-logos': columnsLogosParser,
  'hero-banner': heroBannerParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "products",
  "description": "Product catalog: hero, filterable product groups with overview pop-ups, logo band, contact band",
  "urls": [
    "https://www.solarwinds.com/products"
  ],
  "blocks": [
    {
      "name": "cards-catalog",
      "instances": [
        "div.builder-f1c0d2ea4a47440a93da266a0183861f"
      ]
    },
    {
      "name": "columns-logos",
      "instances": [
        "section.builder-cd3d81e770204306b61d3ebd7c39c7b4"
      ]
    },
    {
      "name": "hero-banner",
      "instances": [
        "section.builder-c548da3c4133491caa3b0200f3824586"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Catalog hero",
      "selector": [
        "section.builder-0cb29e57784e4b408972c257443edb2b"
      ],
      "style": "teal-gradient",
      "blocks": [],
      "defaultContent": [
        "section.builder-0cb29e57784e4b408972c257443edb2b h1",
        "section.builder-0cb29e57784e4b408972c257443edb2b h2"
      ]
    },
    {
      "id": "section-2",
      "name": "Filterable catalog",
      "selector": [
        "div.builder-f1c0d2ea4a47440a93da266a0183861f"
      ],
      "style": null,
      "blocks": [
        "cards-catalog"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Customer logos",
      "selector": [
        "section.builder-cd3d81e770204306b61d3ebd7c39c7b4"
      ],
      "style": "cool-grey",
      "blocks": [
        "columns-logos"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
      "name": "Contact CTA band",
      "selector": [
        "section.builder-c548da3c4133491caa3b0200f3824586"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    }
  ]
};

// TRANSFORMER REGISTRY - generic cleanup, then the products cleanup (removes A/B variant A,
// Builder styles, chevrons; restores heading bold), then section breaks / metadata
const transformers = [
  solarwindsCleanupTransformer,
  solarwindsProductsCleanupTransformer,
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

    // 1. Initial cleanup (scripts, styles, tracking, A/B variant A) + section markers
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
