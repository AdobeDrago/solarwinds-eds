import { blockStory, undecoratedBlockStory } from '../../lib/aem-story.js';
import { fixtureFor } from '../../lib/fixtures.js';

export default { title: 'Blocks/Footer', tags: ['autodocs'] };
export const Decorated = blockStory('footer', fixtureFor('footer'), {
  docs: 'Uses the production footer CSS with a safe static fixture; the production decorator loads a full AEM fragment.',
});
export const Undecorated = undecoratedBlockStory('footer', fixtureFor('footer'));
