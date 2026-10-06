import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Cards Authors', tags: ['autodocs'] };
export const Decorated = blockStory('cards-authors', fixtureFor('cards-authors'));
export const Undecorated = undecoratedBlockStory('cards-authors', fixtureFor('cards-authors'));
