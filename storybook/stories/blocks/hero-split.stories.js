import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Hero Split', tags: ['autodocs'] };
export const Decorated = blockStory('hero-split', fixtureFor('hero-split'));
export const Undecorated = undecoratedBlockStory('hero-split', fixtureFor('hero-split'));
