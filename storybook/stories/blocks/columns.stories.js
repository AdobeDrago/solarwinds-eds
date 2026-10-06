import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns', tags: ['autodocs'] };
export const Decorated = blockStory('columns', fixtureFor('columns'));
export const Undecorated = undecoratedBlockStory('columns', fixtureFor('columns'));
