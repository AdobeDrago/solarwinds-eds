import { page } from '../lib/aem-story.js';

export default {
  title: 'Foundation/Overview',
};

export const Overview = {
  render: () => page(
    'Foundation',
    'The shared design language for every SolarWinds experience: color, typography, spacing, sizing, motion, and elevation.',
  ),
};
