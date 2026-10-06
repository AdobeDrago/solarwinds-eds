import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns Topics', tags: ['autodocs'] };
export const Decorated = blockStory('columns-topics', fixtureFor('columns-topics'));
export const Undecorated = undecoratedBlockStory('columns-topics', fixtureFor('columns-topics'));
