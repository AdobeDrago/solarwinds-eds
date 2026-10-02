# hero-banner

Custom **hero** block. Purpose: contact-cta.

## Authoring (Document Authoring)

Model: `standalone`

Single block table, one column:

- Optional image row: one or more pictures (decorative collages). One picture renders
  on the left only; three or more are split across both sides.
- Content row: a heading plus a paragraph holding only a link (the CTA). Bold
  (`<strong>`) text in the heading renders heavier when no images are authored.

## Supported variations

No variation class. The layout follows the content:

- **With images** (homepage): centered heading and outlined pill CTA between the
  collages.
- **Without images** (products page): the block gets `hero-banner-no-media`. A
  1280px frame with the light/bold heading on the left and a white filled pill CTA
  on the right; stacked and centered below 1024px.

## Universal Editor fields

N/A (Document Authoring project)
