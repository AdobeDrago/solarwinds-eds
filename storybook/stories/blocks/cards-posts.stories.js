import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Posts', tags: ['autodocs'] };
export const Decorated = blockStory('cards-posts', fixtureFor('cards-posts'));
export const Undecorated = undecoratedBlockStory('cards-posts', fixtureFor('cards-posts'));
