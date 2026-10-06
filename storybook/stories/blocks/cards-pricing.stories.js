import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Pricing', tags: ['autodocs'] };
export const Decorated = blockStory('cards-pricing', fixtureFor('cards-pricing'));
export const Undecorated = undecoratedBlockStory('cards-pricing', fixtureFor('cards-pricing'));
