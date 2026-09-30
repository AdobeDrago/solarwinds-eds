# tabs-solutions

Custom **tabs** block. Purpose: solution-tabs.

## Authoring (Document Authoring)

Model: `standalone`

One row per tab, two cells:

1. Tab label.
2. Panel content, in order:
   - the tab's icon image (first picture in the cell) — shown on the pie illustration, not in the panel;
   - a paragraph holding only a Wistia link, e.g. `https://fast.wistia.com/embed/medias/<id>` with the text "<Tab> video" — replaced by the looping video player (the link text becomes the iframe title); any non-Wistia link is left as a normal link;
   - body paragraph, primary CTA, "... capabilities" heading and the link list.

## Behaviour

- **Pie illustration** (desktop, ≥1024px): one shared, decorative (`aria-hidden`) 4-slice pie in the left column. Slice *n* belongs to tab *n* in authored order and uses `pie-<n>-base.svg` / `pie-<n>-active.svg` from this folder. The selected tab's slice turns orange and lifts 28px; clicking a slice selects its tab (hit testing follows the slice shape). The slices fly in the first time the pie scrolls into view. The pie is only drawn when the block has exactly 4 tabs; otherwise panels span the full width.
- **Videos**: the Wistia iframe (autoplay, muted, loop) is created lazily — for the first tab once the block scrolls into view, for other tabs on first selection. Shown at all widths, 16:9, above the panel copy.
- All panels share one grid cell, so the block keeps the height of its tallest panel when switching tabs.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
