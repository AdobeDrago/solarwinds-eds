import { markupStory } from '../../lib/aem-story.js';

export default { title: 'Sections/Styled Sections', tags: ['autodocs'] };
export const Default = markupStory(
  'Styled sections',
  'Section styles provide visual grouping without nesting blocks.',
  '<div><section class="storybook-section-demo highlight"><h2>Highlight section</h2><p>Uses a semantic surface token.</p></section><section class="storybook-section-demo dark"><h2>Dark section</h2><p>Uses inverse background and text tokens.</p></section></div>',
);
