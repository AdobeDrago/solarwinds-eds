# hero-blog

Custom **hero** block: the featured post at the top of the blog home (`/blog`). A linked
headline with a meta line (date | author | category pill) beside a large linked image.

## Authoring (Document Authoring)

Model: `standalone`. A one-column table; row order and extra or missing cells are tolerated.

| hero-blog |
| --- |
| image (it links to the post; the URL is taken from the headline link, or from a link authored next to the image) |
| heading (H2) linked to the post, then one paragraph each for the date, the author link and the category link |

- Paragraphs after the heading become the meta line. A paragraph holding only
  `/blog/category/...` or `/blog/tag/...` links renders as pills; `date | author` in one
  paragraph is split on the pipe.
- Without an image the copy spans the full width.

## Layout

Values from www.solarwinds.com/blog (`.main-featured-post`).

- Up to 992px: the image comes first, full width with no radius; the copy sits below it
  with 24px side padding. The headline is 34/44px. The date and author share a row, and
  the pill is on its own row.
- From 993px: the copy sits on the left (centred vertically) and a 480x270 image (13.6px
  radius) on the right, 40px apart. The headline is 38/48px, and 1px rules separate the
  meta items.
- The section (`blog-hero` in `styles/styles.css`) sets the width: full-bleed up to 992px,
  a 920px column from 993px.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
