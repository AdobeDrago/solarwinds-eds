import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Resources', tags: ['autodocs'] };
export const Decorated = blockStory('cards-resources', fixtureFor('cards-resources'));
export const Undecorated = undecoratedBlockStory('cards-resources', fixtureFor('cards-resources'));
