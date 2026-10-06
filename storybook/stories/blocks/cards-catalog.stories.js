import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Catalog', tags: ['autodocs'] };
export const Decorated = blockStory('cards-catalog', fixtureFor('cards-catalog'));
export const Undecorated = undecoratedBlockStory('cards-catalog', fixtureFor('cards-catalog'));
