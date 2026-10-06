import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Tabs Solutions', tags: ['autodocs'] };
export const Decorated = blockStory('tabs-solutions', fixtureFor('tabs-solutions'));
export const Undecorated = undecoratedBlockStory('tabs-solutions', fixtureFor('tabs-solutions'));
