import { markupStory } from '../../lib/aem-story.js';

export default { title: 'Default Content/Lists', tags: ['autodocs'] };
export const Default = markupStory(
  'Lists',
  'Ordered and unordered lists are rendered as default content.',
  '<div><h2>Platform capabilities</h2><ul><li>Infrastructure monitoring</li><li>Application observability</li><li>Database performance</li></ul><h2>Getting started</h2><ol><li>Connect data sources</li><li>Explore service health</li><li>Resolve issues</li></ol></div>',
);
