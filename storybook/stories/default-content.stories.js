import { markupStory } from '../lib/aem-story.js';

export default {
  title: 'Default Content/Overview',
};

export const Overview = markupStory(
  'Default content',
  'Semantic headings, paragraphs, links, lists, images, and tables render without requiring a block.',
  '<div><h2>Use the simplest content model</h2><p>Default content is the preferred choice when semantic HTML already provides the required structure and behavior.</p></div>',
);
