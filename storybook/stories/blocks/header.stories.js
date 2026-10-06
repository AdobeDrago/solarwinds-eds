import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Header', tags: ['autodocs'] };
export const Decorated = blockStory('header', fixtureFor('header'), {
  docs: 'Uses the production header CSS with a safe static fixture; the production decorator loads navigation fragments and page listeners.',
});
export const Undecorated = undecoratedBlockStory('header', fixtureFor('header'));
