import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns Stats', tags: ['autodocs'] };
export const Decorated = blockStory('columns-stats', fixtureFor('columns-stats'));
export const Undecorated = undecoratedBlockStory('columns-stats', fixtureFor('columns-stats'));
