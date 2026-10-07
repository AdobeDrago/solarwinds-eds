/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ['../stories/**/*.stories.js'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  staticDirs: [
    '../public',
    { from: '../../fonts', to: '/fonts' },
    { from: '../../icons', to: '/icons' },
    { from: '../../project-guides', to: '/project-guides' },
  ],
  docs: {
    autodocs: true,
  },
};

export default config;
