import { markupStory } from '../lib/aem-story.js';

export default {
  title: 'Blocks/Overview',
};

export const Overview = markupStory(
  'Blocks',
  'Blocks are authored as tables, delivered as rows and cells, and decorated by the matching repository JavaScript and CSS. Blocks are never nested.',
  '<div><h2>Story coverage</h2><p>This catalog includes every block currently present in the repository. Interactive stories run the real block decorator against deterministic authored markup.</p></div>',
);
