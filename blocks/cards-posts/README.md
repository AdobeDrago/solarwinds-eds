# cards-posts

Custom **cards** block. Purpose: a row of blog post teasers (image, category pills,
linked title, "date | author").

## Authoring (Document Authoring)

Model: `standalone`

One row per post, two cells:

| Cell | Content |
| --- | --- |
| 1 | Post image (optional; linked to the post, else it takes the title's link) |
| 2 | Optional paragraph of category/tag links (pills), the linked title (H3, or a bold/linked paragraph), the date, then the author link. A single "date \| author" paragraph is split on the pipe. |

Posts without a category keep the same spacing (the source leaves an empty pill row).
The category and author links stay separate links; the image link is hidden from
assistive tech and the tab order because it repeats the title link.

## Looks

The look depends on the section, not on a variation:

- **Default** (the 3 posts under the featured story, section style `blog-hero`):
  296x166.5 rounded images, Title Case pills; stacked 40px apart up to 992px, 3 columns
  16px apart from 993px with the meta lines aligned at the card bottoms.
- **Section style `spotlight`**: UPPERCASE pills, image zooms out on hover and darkens
  while pressed. Up to 1024px: white cards (16px padding, 8px radius) stacked 32px apart;
  from 1025px: cards of up to 278px spread across the row, at least 16px apart.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
