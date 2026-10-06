import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Tabs Deployment', tags: ['autodocs'] };
export const Decorated = blockStory('tabs-deployment', fixtureFor('tabs-deployment'));
export const Undecorated = undecoratedBlockStory('tabs-deployment', fixtureFor('tabs-deployment'));
