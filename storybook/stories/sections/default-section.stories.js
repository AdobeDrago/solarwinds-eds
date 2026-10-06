import { markupStory } from '../../lib/aem-story.js';

export default { title: 'Sections/Default Section', tags: ['autodocs'] };
export const Default = markupStory(
  'Default section',
  'AEM wraps default content and blocks in sections, even when an author does not add an explicit section break.',
  '<section class="storybook-section-demo"><h2>One coherent content group</h2><p>Sections group related default content and blocks.</p></section>',
);
