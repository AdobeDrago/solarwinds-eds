import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns Podcast', tags: ['autodocs'] };
export const Decorated = blockStory('columns-podcast', fixtureFor('columns-podcast'));
export const Undecorated = undecoratedBlockStory('columns-podcast', fixtureFor('columns-podcast'));
