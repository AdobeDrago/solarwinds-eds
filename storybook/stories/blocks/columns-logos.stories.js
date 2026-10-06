import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns Logos', tags: ['autodocs'] };
export const Decorated = blockStory('columns-logos', fixtureFor('columns-logos'));
export const Undecorated = undecoratedBlockStory('columns-logos', fixtureFor('columns-logos'));
