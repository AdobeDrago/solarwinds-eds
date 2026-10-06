import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Tabs', tags: ['autodocs'] };
export const Decorated = blockStory('tabs', fixtureFor('tabs'));
export const Undecorated = undecoratedBlockStory('tabs', fixtureFor('tabs'));
