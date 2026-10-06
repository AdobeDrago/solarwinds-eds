import sectionMetadata from '../../blocks/section-metadata/section-metadata.js';
import { markupStory, page } from '../lib/aem-story.js';

export default {
  title: 'Sections',
  tags: ['autodocs'],
};

export const DefaultSection = markupStory(
  'Default section',
  'AEM wraps default content and blocks in sections, even when an author does not add an explicit section break.',
  '<section class="storybook-section-demo"><h2>One coherent content group</h2><p>Sections group related default content and blocks.</p></section>',
);

export const StyledSection = markupStory(
  'Styled sections',
  'Section styles provide visual grouping without nesting blocks.',
  '<div><section class="storybook-section-demo highlight"><h2>Highlight section</h2><p>Uses a semantic surface token.</p></section><section class="storybook-section-demo dark"><h2>Dark section</h2><p>Uses inverse background and text tokens.</p></section></div>',
);

export const SectionMetadata = {
  render: () => {
    const main = page('Section metadata', 'The real section-metadata decorator converts authored rows into classes and data attributes.');
    const section = document.createElement('section');
    section.className = 'storybook-section-demo';
    section.innerHTML = '<div class="default-content-wrapper"><h2>Metadata-driven section</h2><p>This section receives the highlight class and a campaign data attribute.</p></div><div class="section-metadata-wrapper"><div class="section-metadata"><div><div>Style</div><div>Highlight</div></div><div><div>Campaign</div><div>Storybook</div></div></div></div>';
    main.append(section);
    sectionMetadata(section.querySelector('.section-metadata'));
    return main;
  },
};
