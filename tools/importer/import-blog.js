/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBlogParser from './parsers/hero-blog.js';
import cardsPostsParser from './parsers/cards-posts.js';
import columnsCalloutParser from './parsers/columns-callout.js';
import cardsAuthorsParser from './parsers/cards-authors.js';
import columnsTopicsParser from './parsers/columns-topics.js';
import columnsPodcastParser from './parsers/columns-podcast.js';

// TRANSFORMER IMPORTS
import solarwindsCleanupTransformer from './transformers/solarwinds-cleanup.js';
import solarwindsBlogCleanupTransformer from './transformers/solarwinds-blog-cleanup.js';
import solarwindsSectionsTransformer from './transformers/solarwinds-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-blog': heroBlogParser,
  'cards-posts': cardsPostsParser,
  'columns-callout': columnsCalloutParser,
  'cards-authors': cardsAuthorsParser,
  'columns-topics': columnsTopicsParser,
  'columns-podcast': columnsPodcastParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "blog",
  "description": "Blog landing page: featured story, latest posts, topic rows and featured topics (authored lists)",
  "urls": [
    "https://www.solarwinds.com/blog"
  ],
  "blocks": [
    {
      "name": "hero-blog",
      "instances": [
        ".sw25-om-homepage-hero .main-featured-post"
      ]
    },
    {
      "name": "cards-posts",
      "instances": [
        ".sw25-om-homepage-hero .featured-posts",
        ".sw25-om-category-spotlight .block-head + .block-article"
      ]
    },
    {
      "name": "columns-callout",
      "instances": [
        ".main-content > .sw25-om-callout"
      ]
    },
    {
      "name": "cards-authors",
      "instances": [
        ".sw25-om-featured-voices .voices"
      ]
    },
    {
      "name": "columns-topics",
      "instances": [
        ".sw25-om-featured-categories .categories"
      ]
    },
    {
      "name": "columns-podcast",
      "instances": [
        ".sw-om-techpod-block > .sw19s-std-wrap"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Blog hero: featured story, highlighted posts, Latest Posts",
      "selector": [
        ".sw25-om-homepage-hero"
      ],
      "style": "blog-hero",
      "blocks": [
        "hero-blog",
        "cards-posts"
      ],
      "defaultContent": [
        ".sw25-om-homepage-hero .latest-posts-section"
      ]
    },
    {
      "id": "section-2",
      "name": "Callout: SolarWinds Day",
      "selector": [
        ".sw25-om-homepage-hero + .sw25-om-callout"
      ],
      "style": null,
      "blocks": [
        "columns-callout"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Spotlight: Agentic AI",
      "selector": [
        ".sw25-om-category-spotlight"
      ],
      "style": "spotlight",
      "blocks": [
        "cards-posts"
      ],
      "defaultContent": [
        ".sw25-om-category-spotlight .block-head"
      ]
    },
    {
      "id": "section-4",
      "name": "Featured Voices",
      "selector": [
        ".sw25-om-featured-voices"
      ],
      "style": "panel",
      "blocks": [
        "cards-authors"
      ],
      "defaultContent": [
        ".sw25-om-featured-voices .headline"
      ]
    },
    {
      "id": "section-5",
      "name": "Featured Topics (heading + grid, merged)",
      "selector": [
        ".sw25-om-featured-categories"
      ],
      "style": null,
      "blocks": [
        "columns-topics"
      ],
      "defaultContent": [
        ".sw25-om-featured-categories h2.headline"
      ]
    },
    {
      "id": "section-6",
      "name": "Listen to the Latest TechPod",
      "selector": [
        ".sw-om-techpod-block"
      ],
      "style": "light-grey",
      "blocks": [
        "columns-podcast"
      ],
      "defaultContent": []
    },
    {
      "id": "section-7",
      "name": "Callout: SolarWinds World Tour 2026",
      "selector": [
        ".sw-om-techpod-block + .sw25-om-callout"
      ],
      "style": null,
      "blocks": [
        "columns-callout"
      ],
      "defaultContent": []
    }
  ]
};

// TRANSFORMER REGISTRY - generic cleanup, then the blog cleanup (blog header, analytics
// attributes, default-content conversion), then section breaks / metadata
const transformers = [
  solarwindsCleanupTransformer,
  solarwindsBlogCleanupTransformer,
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

// Blog pages use the blog header and footer: their own nav / footer fragments
// (tools/importer/import-blog-nav.js, import-blog-footer.js) and the "blog" template,
// which header.js / footer.js / styles.css key the blog layout on.
// Keys are lowercase so getMetadata() finds them on every server.
const BLOG_METADATA = [
  ['template', 'blog'],
  ['nav', '/blog/nav'],
  ['footer', '/blog/footer'],
];

/**
 * Appends key / value rows to the metadata table built by createMetadata
 * (a table whose header cell reads "Metadata"); creates the table if there is none.
 * @param {Element} main - The page content
 * @param {Document} document - The DOM document
 * @param {Array<Array<string>>} rows - [key, value] pairs
 */
function addMetadataRows(main, document, rows) {
  let table = [...main.querySelectorAll('table')].reverse()
    .find((t) => (t.querySelector('tr')?.textContent || '').trim().toLowerCase() === 'metadata');
  if (!table) {
    table = WebImporter.DOMUtils.createTable([['Metadata']], document);
    main.append(table);
  }
  const body = table.querySelector('tbody') || table;
  rows.forEach(([key, value]) => {
    const tr = document.createElement('tr');
    [key, value].forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.append(td);
    });
    body.append(tr);
  });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup (scripts, styles, tracking, blog header) + section markers
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
    addMetadataRows(main, document, BLOG_METADATA);
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
