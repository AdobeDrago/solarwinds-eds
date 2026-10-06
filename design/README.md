# Design tokens

The files in `tokens/` are the canonical SolarWinds design dictionary. They use
Tokens Studio's legacy `value`/`type` format, which remains its default and
widest-compatible format. The token sets are selected by `$themes.json` and
ordered by `$metadata.json`.

Generated artifacts:

- `tokens.css` exposes every token as a CSS custom property.
- `../scripts/design-tokens.js` exposes breakpoints needed by runtime JavaScript.

After changing a token, run:

```sh
npm run tokens:build
npm run lint
```

`npm run tokens:check` verifies that generated artifacts match the dictionary.
CSS media queries retain literal breakpoint values because native CSS custom
properties cannot be used in media-query conditions; those values must match
the breakpoint tokens in `tokens/global.json`.
