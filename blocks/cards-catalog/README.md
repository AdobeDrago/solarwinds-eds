# cards-catalog

Custom **cards** block. Purpose: product-catalog-filter.

## Authoring (Document Authoring)

Model: `standalone`

One block table for the whole catalog. The block recognises each row by its content, so authors only use headings and cells:

| Row | Cells | Content |
| --- | --- | --- |
| Sidebar note (optional, first row) | 1 | `**Not sure where to start?**`, a paragraph, a `Contact Sales` link |
| Category | 1 | Only an H2, e.g. `Monitoring & Observability`. The product rows after it belong to this category, up to the next H2 row |
| Product | 3 | 1. Card: H3 with the linked product name, an *italic* tagline paragraph, a description, a **bold** trial link (e.g. `Start Trial`), the trial note (`30-day trial`)<br>2. Product type: `SaaS` or `Self-Hosted` (comma-separated if a product has several)<br>3. Overview (opens in a modal): product icon image, then an optional H3 with the linked modal title (e.g. `Serv-U File Transfer Protocol Server`, linked to the product page; without it the modal shows the card name), description, **bold** trial link (e.g. `Download Free Trial`), *italic* `Learn More` link, a Wistia URL (`https://fast.wistia.com/medias/<id>`) or an image, then the highlights as H4 + paragraph (three on the source) |

Any part of any cell may be left out: without cell 3 there is no "See Overview" button, without a type the product only matches when no type filter is set. Product SVG icons are shown as authored. Colour them as on the source (`fill="#ff6200"` on the root `<svg>`), because an `<img>` cannot inherit a CSS colour.

## Rendering notes

- Filter (generated): a "Filter" label with collapsible **Category** (built from the H2s, A–Z) and **Product Type** (built from the distinct types) checkbox groups, both collapsed at first. Within a group the checked values combine with OR, and the two groups combine with AND.
- While a filter is active, the block shows "Showing **N** products", a removable chip for each selected value (in selection order) and "Remove All Filters". Each group's "N products" count updates ("1 product" for one), groups with no matches are hidden, and when nothing matches "No results found" takes the place of the "Showing" line (as on the source). The URL is not changed.
- At 1024px and wider, the filter and note sit in a 320px sidebar beside the catalog (at most 816px wide). Below 1024px, a "Filter" button opens the filter as a right-hand drawer (a native modal `<dialog>`, 400px wide at most) with a close button and "See Results". As on the source, the sidebar note is not shown below 1024px, and the Filter button sits at the top right of the white gap above the catalog: its offsets in `cards-catalog.css` follow the section frame in `styles/styles.css` (`.cards-catalog-container`), so update both together.
- Cards: 1 column below 640px, 2 columns with dividers from 640px. Divider classes (`cards-catalog-card-start`, `-last`, `-last-row`) are recomputed after each filter change.
- Overview modal: a native modal `<dialog>` labelled by its title (the overview H3, shown as a link when it has one, else the card name). Focus moves to its close button, the page is inert, and Escape, the close button or a backdrop click close it. Focus then returns to "See Overview" and page scroll is locked while it is open. The modal is a centred 994px box at 1024px and above; below that it is full height and as wide as the viewport (at most the viewport height, 994px), as on the source. Videos are shown in a 16:9 box; modal images keep their natural ratio. From 768px the highlights (grey `#f4f7f7` column) sit beside the main column; below 768px they stack.
- Performance: overview content stays detached until a modal opens, so its icon, image and video do not load with the page. The Wistia iframe (`fast.wistia.net/embed/iframe/<id>`), with the blurred Wistia swatch as its poster, is created when the modal opens and removed when it closes, which also stops playback. Modal images are `loading="lazy"`.

## Localisation

The UI strings the block generates (Filter, Category, Product Type, "{0} product(s)", "Showing {0}", "Remove {0} filter", Remove All Filters, No results found, See Overview, See Results, Close, Close filter) are kept in `STRINGS` at the top of `cards-catalog.js`, keyed by `<html lang>`. English is the default. To translate, add a locale, e.g. `STRINGS.fr = { filter: 'Filtrer', ... }`. Keys you leave out fall back to English. There is no French strings set yet, because www.solarwinds.com/fr/products redirects to the English page.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
