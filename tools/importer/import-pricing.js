/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsPricingParser from './parsers/cards-pricing.js';
import tabsDeploymentParser from './parsers/tabs-deployment.js';
import cardsProductsParser from './parsers/cards-products.js';
import cardsToolsParser from './parsers/cards-tools.js';

// TRANSFORMER IMPORTS
import solarwindsCleanupTransformer from './transformers/solarwinds-cleanup.js';
import solarwindsPricingCleanupTransformer from './transformers/solarwinds-pricing-cleanup.js';
import solarwindsSectionsTransformer from './transformers/solarwinds-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-pricing': cardsPricingParser,
  'tabs-deployment': tabsDeploymentParser,
  'cards-products': cardsProductsParser,
  'cards-tools': cardsToolsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "pricing",
  "description": "Pricing page: dark hero, pricing tier cards, deployment filter over categorized product rows, tool grids",
  "urls": [
    "https://www.solarwinds.com/pricing"
  ],
  "blocks": [
    {
      "name": "cards-pricing",
      "instances": [
        ".builder-04207812404f401288963eb0b9f1ff34"
      ]
    },
    {
      "name": "tabs-deployment",
      "instances": [
        ".builder-4d439d8d25f84dab916524a60834d507",
        ".sticky-filter-heading"
      ]
    },
    {
      "name": "cards-products",
      "instances": [
        ".builder-96fa0d28cbc04fa196787384ef39053e",
        ".builder-af9942e3c72a47dba6c7e720b1dc2c10",
        ".builder-a1a8fad66d34471f99ba10266b52fa10",
        ".builder-9dc7491e394d4f57a1e1ec91c65e01c8"
      ]
    },
    {
      "name": "cards-tools",
      "instances": [
        ".builder-1eb4f90e44294ac682b429fc43891e89",
        ".builder-9a9489ef35db49aebe34ad8e6836d3b5"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Pricing hero",
      "selector": [
        ".builder-5c0a2bfd7b7940deb5183e03c5bcd8e3"
      ],
      "style": "dark",
      "blocks": [],
      "defaultContent": [
        ".builder-5c0a2bfd7b7940deb5183e03c5bcd8e3 h1",
        ".builder-5c0a2bfd7b7940deb5183e03c5bcd8e3 h2"
      ]
    },
    {
      "id": "section-2",
      "name": "Pricing tiers",
      "selector": [
        ".builder-04207812404f401288963eb0b9f1ff34"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-pricing"
      ],
      "defaultContent": [
        "#footnote-section"
      ]
    },
    {
      "id": "section-3",
      "name": "Filter and product list",
      "selector": [
        ".builder-4d439d8d25f84dab916524a60834d507",
        ".sticky-filter-heading"
      ],
      "style": null,
      "blocks": [
        "tabs-deployment",
        "cards-products"
      ],
      "defaultContent": [
        ".builder-ca5307043e3c467c8aa6a9f3bf0356e8",
        ".builder-d8ccab92cd48443ea05ad7d3b3ee4130",
        ".builder-be869100703a4dcf8272cdaa2e28c06f",
        ".builder-5e0934aec3754cc9aeeccecf90825e93"
      ]
    },
    {
      "id": "section-4",
      "name": "Tool grids",
      "selector": [
        ".builder-979bc0bb462e4f25850bb1f15c73b362"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-tools"
      ],
      "defaultContent": [
        ".builder-052521f802ed49f7bf66376efd4e8b86",
        ".builder-5c178d654332455bb686e34a46851882",
        ".builder-7aeceef24ef84dceaaab5df6606a6aad"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - generic cleanup, then the pricing cleanup (maps product icons to DA
// assets before the remaining data: images are removed), then section breaks / metadata
const transformers = [
  solarwindsCleanupTransformer,
  solarwindsPricingCleanupTransformer,
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

    // 1. Initial cleanup (scripts, styles, tracking, icon mapping) + section markers
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
