import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Hero', tags: ['autodocs'] };
export const Decorated = blockStory('hero', fixtureFor('hero'));
export const Undecorated = undecoratedBlockStory('hero', fixtureFor('hero'));
