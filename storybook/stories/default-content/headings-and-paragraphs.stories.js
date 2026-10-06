import { markupStory } from '../../lib/aem-story.js';

export default { title: 'Default Content/Headings and Paragraphs', tags: ['autodocs'] };
export const Default = markupStory(
  'Headings and paragraphs',
  'Default content uses semantic HTML directly and does not require a block.',
  '<article><h1>Heading level one</h1><p>Introductory body copy for a page.</p><h2>Heading level two</h2><p>Supporting information organized into a clear hierarchy.</p><h3>Heading level three</h3><p>Detailed content for a focused topic.</p></article>',
);
