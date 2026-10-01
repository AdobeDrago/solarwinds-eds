# columns-callout

Custom **columns** block. Purpose: event-promo (blog landing page, from `.sw25-om-callout`).

## Authoring (Document Authoring)

Model: `standalone`

Single block table, one row with two cells:

- **Copy cell**: headline (H2), paragraph(s), and a CTA link in its own paragraph (the last
  link-only paragraph). It renders as a bold underlined text link, not a button; links to
  another host get an orange external-link icon.
- **Image cell**: a picture, optionally followed by a link (the image becomes that link).

The cell order decides the image side on desktop: image cell first = image on the left.
On phones and tablets (992px and below) the image always sits on top.

The desktop image keeps its natural size (608x342 and 487x258 on the source), centred
on the row height in a 504px column, so a taller image overlaps the band.

## Supported variations

| Variation | Option class | Effect |
| --- | --- | --- |
| Background | `background` | Full-bleed patterned band (`columns-callout-background.jpg`) behind the block |

## Universal Editor fields

N/A (Document Authoring project)
