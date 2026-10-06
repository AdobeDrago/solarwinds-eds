import '../../styles/styles.css';
import '../../styles/lazy-styles.css';
import '../../styles/fonts.css';
import '../styles/storybook.css';

import.meta.glob('../../blocks/*/*.css', { eager: true });

window.hlx = {
  codeBasePath: window.location.origin,
  rum: {
    collector: () => undefined,
    isSelected: false,
  },
};
document.documentElement.lang = 'en';
document.body.classList.add('appear');

export default {
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
    options: {
      storySort: {
        order: [
          'Foundation',
          'Sections',
          'Default Content',
          'Blocks',
          'Widgets',
        ],
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};
