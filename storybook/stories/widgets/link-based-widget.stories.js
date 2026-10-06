import { blockStory } from '../../lib/aem-story.js';
import { widgetFixture } from '../../lib/fixtures.js';

export default { title: 'Widgets/Link Based Widget', tags: ['autodocs'] };
export const Default = blockStory('widget', widgetFixture, {
  docs: 'Runs the production widget loader against local Storybook HTML, CSS, and JavaScript assets.',
});
