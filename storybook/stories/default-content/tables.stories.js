import { markupStory } from '../../lib/aem-story.js';

export default { title: 'Default Content/Tables', tags: ['autodocs'] };
export const Default = markupStory(
  'Tables',
  'A normal authored table remains default content unless its first row identifies a block.',
  '<table><thead><tr><th>Capability</th><th>SaaS</th><th>Self-hosted</th></tr></thead><tbody><tr><td>Infrastructure monitoring</td><td>Included</td><td>Included</td></tr><tr><td>Automatic upgrades</td><td>Included</td><td>Managed by customer</td></tr></tbody></table>',
);
