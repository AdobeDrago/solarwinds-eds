import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Carousel Testimonial', tags: ['autodocs'] };
export const Decorated = blockStory('carousel-testimonial', fixtureFor('carousel-testimonial'));
export const Undecorated = undecoratedBlockStory('carousel-testimonial', fixtureFor('carousel-testimonial'));
