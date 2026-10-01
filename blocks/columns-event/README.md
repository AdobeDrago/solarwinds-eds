# columns-event

Custom **columns** block. Purpose: event-promo (French homepage World Tour band).

## Authoring (Document Authoring)

Model: `standalone`

Single block table, one row with two cells:

- **Image cell**: the promo picture, optionally followed by a link (the image becomes that link).
- **Copy cell**: heading (H2), paragraph(s), and a CTA link in its own paragraph (the last
  link-only paragraph). The CTA always renders as the outlined pill (global `secondary`
  button), so italics are optional.

The block paints the full-bleed orange band, the decorative dotted-pattern shadow
(`columns-event-dot-pattern.png`) behind the image and the small teal/cyan "gidget" bar at the
band's bottom-left (`columns-event-gidget.svg`); authors do not add them. The image is on the
left from 1024px up (whichever cell it was authored in) and centred above the copy below
1024px. Below 768px the band is capped at 720px and centred, as on the source. Without an
image the copy renders alone, centred.

The CTA keeps the global secondary pill but, on this orange band, its outline turns white on
hover (light grey when pressed) instead of orange; keyboard focus adds the global inset rings
plus a teal ring.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
