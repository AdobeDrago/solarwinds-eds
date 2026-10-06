import { blockStory, markupStory } from '../lib/aem-story.js';
import { widgetFixture } from '../lib/fixtures.js';

export default {
  title: 'Widgets',
  tags: ['autodocs'],
};

export const Overview = markupStory(
  'Widgets',
  'Widgets are self-contained, application-like features that authors add with a link to a resource under /widgets.',
  '<div><h2>Use a widget for application-like functionality</h2><p>Forms, calculators, search results, and similar features can load their own HTML, CSS, and JavaScript while keeping authoring to a single link.</p></div>',
);

export const LinkBasedWidget = blockStory('widget', widgetFixture, {
  docs: 'Runs the production widget loader against local Storybook HTML, CSS, and JavaScript assets.',
});
