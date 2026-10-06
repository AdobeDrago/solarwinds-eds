import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Products', tags: ['autodocs'] };
export const Decorated = blockStory('cards-products', fixtureFor('cards-products'));
export const Undecorated = undecoratedBlockStory('cards-products', fixtureFor('cards-products'));
