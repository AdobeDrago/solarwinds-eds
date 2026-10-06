import { markupStory } from '../lib/aem-story.js';

export default {
  title: 'Default Content',
  tags: ['autodocs'],
};

export const HeadingsAndParagraphs = markupStory(
  'Headings and paragraphs',
  'Default content uses semantic HTML directly and does not require a block.',
  '<article><h1>Heading level one</h1><p>Introductory body copy for a page.</p><h2>Heading level two</h2><p>Supporting information organized into a clear hierarchy.</p><h3>Heading level three</h3><p>Detailed content for a focused topic.</p></article>',
);

export const LinksAndButtons = markupStory(
  'Links and buttons',
  'Plain links remain inline. Authored emphasis is decorated as primary, secondary, or accent calls to action.',
  '<div><p><a href="#">Inline text link</a></p><p class="button-wrapper"><a class="button primary" href="#">Primary action</a></p><p class="button-wrapper"><a class="button secondary" href="#">Secondary action</a></p><p class="button-wrapper"><a class="button accent" href="#">Accent action</a></p></div>',
);

export const Lists = markupStory(
  'Lists',
  'Ordered and unordered lists are rendered as default content.',
  '<div><h2>Platform capabilities</h2><ul><li>Infrastructure monitoring</li><li>Application observability</li><li>Database performance</li></ul><h2>Getting started</h2><ol><li>Connect data sources</li><li>Explore service health</li><li>Resolve issues</li></ol></div>',
);

export const Images = markupStory(
  'Images',
  'The backend supplies responsive picture markup that can remain default content or be consumed by a block.',
  '<figure><picture><img src="/icons/nav-observability.svg" alt="Observability" width="240" height="240"></picture><figcaption>Repository assets are served directly by Storybook.</figcaption></figure>',
);

export const Tables = markupStory(
  'Tables',
  'A normal authored table remains default content unless its first row identifies a block.',
  '<table><thead><tr><th>Capability</th><th>SaaS</th><th>Self-hosted</th></tr></thead><tbody><tr><td>Infrastructure monitoring</td><td>Included</td><td>Included</td></tr><tr><td>Automatic upgrades</td><td>Included</td><td>Managed by customer</td></tr></tbody></table>',
);
