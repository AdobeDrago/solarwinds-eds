# columns-topics

Custom **columns** block. Purpose: featured blog topics ("Featured Topics" on /blog),
side by side, each with a short list of posts.

## Authoring (Document Authoring)

Model: `standalone`

One row, one cell per topic (extra rows add more topics; up to 4 per row on desktop).
Each cell holds, in order:

1. A heading (H3) linking to the category, e.g. `ITSM`. Type it as it should appear
   (the source uses uppercase text; the block does not transform case).
2. Per post: a paragraph that is only the linked post title, then the meta paragraphs:
   the date, then the linked author (or one `date | author` paragraph).

## Rendering

- Heading: bold, letter-spaced, with a `#a0b9b9` chevron (CSS mask) and a 1px `#ccc`
  rule under it.
- Post: bold title link, then `date | author` (Roboto Slab date from 769px, a 1px
  `#a0b9b9` divider, underlined author link).
- Topics stack up to 992px and sit in one row from 993px. Heading and title links
  underline on hover and keyboard focus; focus also shows the project's teal outline.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
