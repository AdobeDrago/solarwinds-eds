import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns Awards', tags: ['autodocs'] };
export const Decorated = blockStory('columns-awards', fixtureFor('columns-awards'));
export const Undecorated = undecoratedBlockStory('columns-awards', fixtureFor('columns-awards'));
