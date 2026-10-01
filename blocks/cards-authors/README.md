# cards-authors

Custom **cards** block. Purpose: a row of featured blog authors ("Featured Voices"):
round headshot beside the author's name and job title.

## Authoring (Document Authoring)

Model: `standalone`

One row per author, two cells:

| Cell | Content |
| --- | --- |
| 1 | Square headshot image (shown as a circle; optional) |
| 2 | The author's name as a link to the author page, then a paragraph with the job title |

The first link in a card (normally the name) becomes the link for the whole card, so
the image, name and title are one link. A card without a link is shown unlinked. The
headshot is decorative (empty alt) because the name follows it in the same link.
The orange arc next to each face on www.solarwinds.com is part of the photos, so use
the same branded headshot images.

## Looks

- Up to 992px: cards stacked 32px apart, left-aligned, 94px headshots.
- From 993px: one centred row, cards 60px apart, 112px headshots (from 1081px each
  card is 300px wide). More than 3 authors wrap to a new row.
- Hover: the name and title are underlined and the headshot gets a soft shadow.
  Keyboard focus shows the project's teal outline.

Place it in a section with style `panel` (grey rounded panel, see `styles/styles.css`).

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
