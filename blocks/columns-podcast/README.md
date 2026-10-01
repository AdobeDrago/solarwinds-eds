# columns-podcast

Custom **columns** block. Purpose: podcast-player ("Listen to the Latest TechPod" on /blog).

## Authoring (Document Authoring)

Model: `standalone`

One row, two cells:

1. Heading, a paragraph holding only the Wistia link (`https://fast.wistia.com/embed/medias/{id}`;
   link text = episode title, or the bare URL), a paragraph of tag/category links
   (`/blog/tag/...`, `/blog/category/...`), and the date paragraph.
2. Episode image (optionally linked).

Cells may be missing: without an image the copy spans the full width; without a Wistia
link no player is built.

## Behaviour

- The Wistia link becomes a 90px player box. Until Wistia loads it shows the link as a
  play button (bare-URL text reads "Play episode"). `https://fast.wistia.com/player.js`
  and `<wistia-player>` load when the block is within 200px of the viewport, or on click.
  The box height is fixed, so the swap causes no layout shift. If Wistia fails, the plain
  link stays.
- Tag links render as pills on one line with the date (pills wrap on narrow screens).
- Up to 1024px the layout stacks: heading, image, player, then pills + date (CSS `order`;
  the heading is authored once). From 1025px the copy and image sit side by side.

Uses `scripts/blog.js` (pill/button helpers) and `scripts/wistia.js` (media id parsing),
shared with other blog blocks and tabs-solutions.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
