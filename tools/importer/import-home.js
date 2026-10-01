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
import columnsEventParser from './parsers/columns-event.js';

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
  'columns-event': columnsEventParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
// English: Builder.io A/B test, variant A (.a-53874) is migrated; the cleanup transformer
// removes variant B (.b-53874) before parsing. French (/fr) has no variants.
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "SolarWinds homepage, English (/) and French (/fr) (Builder.io). English ships two A/B variants in the DOM (.a-53874 / .b-53874): variant A is migrated and the cleanup removes .b-53874. French has no variants; each block/section lists its English and French selectors. /fr adds a World Tour band (columns-event).",
  "urls": [
    "https://www.solarwinds.com/",
    "https://www.solarwinds.com/fr"
  ],
  "blocks": [
    {
      "name": "hero-split",
      "instances": [
        ".builder-5e8ffb11e27245fb9426cd6bbe299166",
        "section.builder-931818d7d6244726a7517644d8f6f5d3"
      ]
    },
    {
      "name": "columns-logos",
      "instances": [
        ".builder-23fd21cbbb5146eca6ea23014dd592ce",
        "section.builder-ae8ac7893e9843b09f8c2a090c4e57fb"
      ]
    },
    {
      "name": "columns-event",
      "instances": [
        "section.builder-63cc92ea037a4b6b8f94601a5fb7f0c0"
      ]
    },
    {
      "name": "tabs-solutions",
      "instances": [
        ".builder-938ec099cb994c228ea38e253fe88027",
        ".builder-2f5ad81ce6df4f3895023f40e4435962"
      ]
    },
    {
      "name": "hero-banner",
      "instances": [
        ".builder-c61cb09d9e344c588de162c4e9a3e93b",
        "section.builder-a50393aa31304385a67b1d58cfefc1e1"
      ]
    },
    {
      "name": "cards-feature",
      "instances": [
        ".builder-0e539bc39f9440efa8b9c7d3ea57e375",
        ".builder-17d7b22616c84c489fc300787f0d010e"
      ]
    },
    {
      "name": "carousel-testimonial",
      "instances": [
        ".builder-dbd3271aa0a64dda81d871bbb526ac44",
        "section.builder-d083a914c6b147e39e64af943c95a436"
      ]
    },
    {
      "name": "columns-stats",
      "instances": [
        ".builder-11494af395b74565b682f095dd7dc4ad",
        "section.builder-bb6c8a60df264ee6aaaf2675aab825e1"
      ]
    },
    {
      "name": "columns-awards",
      "instances": [
        ".builder-69539e951525462794cee442e22436ab"
      ]
    },
    {
      "name": "cards-resources",
      "instances": [
        ".builder-d8f426a8e5b04a61a320ccb11792acf7",
        ".builder-d76fba0471ea474bae0190da6f0715da"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "hero",
      "selector": [
        "section.builder-5e8ffb11e27245fb9426cd6bbe299166",
        "section.builder-931818d7d6244726a7517644d8f6f5d3"
      ],
      "style": null,
      "blocks": [
        "hero-split"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "customer-logos",
      "selector": [
        "section.builder-23fd21cbbb5146eca6ea23014dd592ce",
        "section.builder-ae8ac7893e9843b09f8c2a090c4e57fb"
      ],
      "style": "light-teal",
      "blocks": [
        "columns-logos"
      ],
      "defaultContent": []
    },
    {
      "id": "2b",
      "name": "world-tour",
      "selector": [
        "section.builder-63cc92ea037a4b6b8f94601a5fb7f0c0"
      ],
      "style": null,
      "blocks": [
        "columns-event"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "solutions-tabs",
      "selector": [
        "section.builder-12d9733bed1a4281bad8e0d5c6f75939",
        "section.builder-85f7da40dd8248d995c6b676db940f57"
      ],
      "style": null,
      "blocks": [
        "tabs-solutions"
      ],
      "defaultContent": [
        ".builder-0d7ee48204e645bc93ece752e3f677f5",
        ".builder-f23466c373e2432093fa5c7c74f98756"
      ]
    },
    {
      "id": "4",
      "name": "contact-cta",
      "selector": [
        "section.builder-c61cb09d9e344c588de162c4e9a3e93b",
        "section.builder-a50393aa31304385a67b1d58cfefc1e1"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "ai-resources",
      "selector": [
        "section.builder-cb406aab14a64cb6bccbf9d322efe7d2",
        "section.builder-5f46aff3209c468d8ac41ba4617ecfba"
      ],
      "style": "dark",
      "blocks": [
        "cards-feature"
      ],
      "defaultContent": [
        ".builder-deeb6d31d4cd4d8aa0ccbf9c9163828b",
        ".builder-aed66058078745d59fb682b0e25da259"
      ]
    },
    {
      "id": "6",
      "name": "testimonials",
      "selector": [
        "section.builder-01046a9d32dc4f4281fe5a4800283564",
        "section.builder-2bee9fb5a9804365ba5469f3794cc5ee"
      ],
      "style": "teal",
      "blocks": [
        "carousel-testimonial"
      ],
      "defaultContent": [
        ".builder-e90ffb7b51c043bc8082f3451ab6d682",
        ".builder-ed8f53c3b0dd4f0fb5dba21232f4dfa6"
      ]
    },
    {
      "id": "7",
      "name": "stats",
      "selector": [
        "section.builder-11494af395b74565b682f095dd7dc4ad",
        "section.builder-bb6c8a60df264ee6aaaf2675aab825e1"
      ],
      "style": null,
      "blocks": [
        "columns-stats"
      ],
      "defaultContent": []
    },
    {
      "id": "8",
      "name": "awards",
      "selector": [
        ".builder-985226446bcd44af9653024d75fc2305",
        "div.builder-60caeca61b9847409ea3f0b98849662a.builder-symbol",
        "section.builder-69539e951525462794cee442e22436ab"
      ],
      "style": null,
      "blocks": [
        "columns-awards"
      ],
      "defaultContent": []
    },
    {
      "id": "9",
      "name": "resources",
      "selector": [
        "section.builder-9f6ff11230044ad591518e5d74567018",
        "section.builder-7505fa63e3324bb7a3d76041566d9412"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-resources"
      ],
      "defaultContent": [
        ".builder-2adb95ecd59f402b912f4cdc1834fe76",
        ".builder-96bd3a0257bd40a89b9c9f4a6bd7151d"
      ]
    }
  ]
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
