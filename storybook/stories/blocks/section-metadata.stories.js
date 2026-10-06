import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Section Metadata', tags: ['autodocs'] };
export const Decorated = blockStory('section-metadata', fixtureFor('section-metadata'));
export const Undecorated = undecoratedBlockStory('section-metadata', fixtureFor('section-metadata'));
