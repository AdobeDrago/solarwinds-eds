import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns Event', tags: ['autodocs'] };
export const Decorated = blockStory('columns-event', fixtureFor('columns-event'));
export const Undecorated = undecoratedBlockStory('columns-event', fixtureFor('columns-event'));
