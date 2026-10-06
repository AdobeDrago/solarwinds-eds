import { markupStory } from '../lib/aem-story.js';

export default {
  title: 'Sections/Overview',
};

export const Overview = markupStory(
  'Sections',
  'Sections group related default content and blocks. Visual styles and metadata belong to the section rather than nesting blocks.',
  '<div><h2>Section principles</h2><ul><li>Every page contains at least one section.</li><li>Sections can contain default content and multiple sibling blocks.</li><li>Blocks are never nested.</li></ul></div>',
);
