import { markupStory } from '../../lib/aem-story.js';

export default { title: 'Default Content/Images', tags: ['autodocs'] };
export const Default = markupStory(
  'Images',
  'The backend supplies responsive picture markup that can remain default content or be consumed by a block.',
  '<figure><picture><img src="/icons/nav-observability.svg" alt="Observability" width="240" height="240"></picture><figcaption>Repository assets are served directly by Storybook.</figcaption></figure>',
);
