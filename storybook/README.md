# Storybook

This catalog uses Storybook with the HTML/Vite framework and mirrors the AEM
content model described in the Edge Delivery Services documentation:

1. Foundation
2. Sections
3. Default Content
4. Blocks
5. Widgets

Run the development catalog:

```sh
npm run storybook
```

Build the static catalog:

```sh
npm run storybook:build
```

Stories reuse the repository's design tokens, fonts, icons, block CSS, and block
decorators. Fixtures represent the authored rows and cells delivered by the AEM
backend. Header, footer, and fragment stories intentionally use static fixtures
because their production decorators load whole-page fragments and global page
behavior.
