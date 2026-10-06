import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards', tags: ['autodocs'] };
export const Decorated = blockStory('cards', fixtureFor('cards'));
export const Undecorated = undecoratedBlockStory('cards', fixtureFor('cards'));
