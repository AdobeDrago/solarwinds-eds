import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Tools', tags: ['autodocs'] };
export const Decorated = blockStory('cards-tools', fixtureFor('cards-tools'));
export const Undecorated = undecoratedBlockStory('cards-tools', fixtureFor('cards-tools'));
