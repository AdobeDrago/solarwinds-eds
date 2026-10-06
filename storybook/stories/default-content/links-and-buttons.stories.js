import { markupStory } from '../../lib/aem-story.js';

export default { title: 'Default Content/Links and Buttons', tags: ['autodocs'] };
export const Default = markupStory(
  'Links and buttons',
  'Plain links remain inline. Authored emphasis is decorated as primary, secondary, or accent calls to action.',
  '<div><p><a href="#">Inline text link</a></p><p class="button-wrapper"><a class="button primary" href="#">Primary action</a></p><p class="button-wrapper"><a class="button secondary" href="#">Secondary action</a></p><p class="button-wrapper"><a class="button accent" href="#">Accent action</a></p></div>',
);
