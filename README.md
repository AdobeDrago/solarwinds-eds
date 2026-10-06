# SolarWinds
Your project's description...

## Environments
- Preview: https://main--solarwinds-eds--AdobeDrago.aem.page/
- Live: https://main--solarwinds-eds--AdobeDrago.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Design tokens

The canonical design dictionary lives in [`design/tokens`](design/tokens) and
uses Tokens Studio's legacy `value`/`type` format. It defines color,
typography, sizing, spacing, margins, padding, borders, radii, opacity, motion,
elevation, effects, layout, and breakpoint tokens.

Do not edit the generated [`design/tokens.css`](design/tokens.css) or
[`scripts/design-tokens.js`](scripts/design-tokens.js) files directly. After
changing a token set, regenerate and validate the artifacts:

```sh
npm run tokens:build
npm run tokens:check
npm run lint
```

Project-owned CSS must reference generated custom properties instead of raw
design values. JavaScript breakpoint decisions must use the exports from
`scripts/design-tokens.js`. Native CSS custom properties cannot be used in
media-query conditions, so those values remain literal in CSS and are mirrored
by breakpoint tokens in the dictionary.

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `solarwinds-eds` directory in your favorite IDE and start coding :)
