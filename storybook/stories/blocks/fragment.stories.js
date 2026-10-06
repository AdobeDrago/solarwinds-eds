import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Fragment', tags: ['autodocs'] };
export const Decorated = blockStory('fragment', fixtureFor('fragment'), {
  docs: 'Shows reusable fragment content without importing the full-page fragment loader.',
});
export const Undecorated = undecoratedBlockStory('fragment', fixtureFor('fragment'));
