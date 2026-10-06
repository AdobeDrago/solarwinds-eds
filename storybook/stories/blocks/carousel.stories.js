import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Carousel', tags: ['autodocs'] };
export const Decorated = blockStory('carousel', fixtureFor('carousel'));
export const Undecorated = undecoratedBlockStory('carousel', fixtureFor('carousel'));
