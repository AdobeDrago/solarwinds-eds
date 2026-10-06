import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Feature', tags: ['autodocs'] };
export const Decorated = blockStory('cards-feature', fixtureFor('cards-feature'));
export const Undecorated = undecoratedBlockStory('cards-feature', fixtureFor('cards-feature'));
