import sectionMetadata from '../../../blocks/section-metadata/section-metadata.js';
import { page } from '../../lib/aem-story.js';

export default { title: 'Sections/Section Metadata', tags: ['autodocs'] };
export const Default = {
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
