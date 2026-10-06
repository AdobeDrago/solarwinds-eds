import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Hero Banner', tags: ['autodocs'] };
export const Decorated = blockStory('hero-banner', fixtureFor('hero-banner'));
export const Undecorated = undecoratedBlockStory('hero-banner', fixtureFor('hero-banner'));
