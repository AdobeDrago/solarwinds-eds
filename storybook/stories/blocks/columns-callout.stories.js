import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Columns Callout', tags: ['autodocs'] };
export const Decorated = blockStory('columns-callout', fixtureFor('columns-callout'));
export const Undecorated = undecoratedBlockStory('columns-callout', fixtureFor('columns-callout'));
