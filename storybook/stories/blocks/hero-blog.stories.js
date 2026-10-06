import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Hero Blog', tags: ['autodocs'] };
export const Decorated = blockStory('hero-blog', fixtureFor('hero-blog'));
export const Undecorated = undecoratedBlockStory('hero-blog', fixtureFor('hero-blog'));
