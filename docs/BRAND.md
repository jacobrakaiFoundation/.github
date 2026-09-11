# Foundation GitHub masthead

The current masthead adapts the Foundation website at https://jacobrakai.org/. The personal profile and its workshop illustration are separate.

`profile/foundation-light.svg` and `profile/foundation-dark.svg` use:

- The homepage's exact headline: “Free court forms. Open security research.”
- Playfair Display at weight 500, matching the website heading. Glyphs are outlined so the image does not depend on external font loading or the viewer's installed fonts.
- The homepage's network paths and nodes, rendered without animation.
- Light colors: background `#faf6f0`, text `#211d18`, network `#b23a25`.
- Dark colors: background `#17130f`, text `#f4ede1`, network `#f2694f`.

Source references: the website's `src/index.njk`, `src/css/site.css`, and `src/fonts/playfair-display-regular.woff2`. This is a deterministic vector adaptation, not generated raster artwork. Each SVG has an accessible title and description; the README also supplies alternative text. Essential project descriptions and links remain ordinary Markdown.

GitHub's `gh-light-mode-only` and `gh-dark-mode-only` link suffixes select the masthead for the reader's GitHub appearance, including an explicit appearance choice. Both link to the Foundation homepage. GitHub retains control of body typography and page chrome.

The earlier raster illustration and original banner are retained for historical links but are no longer embedded in the organization profile.

## Diagram assets

`profile/diagram-forms-*.svg`, `profile/diagram-research-*.svg` and
`profile/diagram-blocklist-*.svg` extend the masthead's approach to the rest of the
organization profile. Like the masthead, they are deterministic vector work, not
generated raster artwork.

`diagram-research-*` and `diagram-blocklist-*` are ports of the two `.work-visual`
diagrams already published on the website homepage, inside the "Threat research" and
"Public blocklist" cards. Every path is carried over unchanged. `diagram-forms-*` is
new, drawn in the same vocabulary — `rx="8"` paper rectangles, the folded-corner
document glyph and the chevron from the research diagram, `opacity=".3"` connective
rules, and an accent check at `stroke-width="3"`.

GitHub strips `<style>`, `class` and inline `<svg>` from Markdown, so the website's
CSS variables are resolved to literal values, one file per theme:

| Role | Website token | Light | Dark |
| --- | --- | --- | --- |
| Line | `.work-visual{color:var(--text-muted)}` | `#6f665a` | `#b7ab99` |
| Paper | `.diagram-paper{fill:var(--paper)}` | `#fffdf9` | `#211b15` |
| Accent | `.diagram-accent{stroke:var(--accent-ink)}` | `#b23a25` | `#f2694f` |

The diagrams carry no background. The website draws them on a `--bg` panel, but on
GitHub the page colour already sits behind the image, and a transparent asset stays
correct if the theme-switching mechanism below ever stops working.

**Stroke weight follows the display width, not the file.** `stroke-width` is `1.5` in
every asset, so the hairline a reader actually sees is `1.5 × (display width ÷ viewBox
width)`. Measured in the profile column at 858px:

| Asset | viewBox width | Rendered at 858px | Hairline | At 358px (phone) |
| --- | --- | --- | --- | --- |
| `diagram-forms-*` | 960 | 858px (×0.89) | 1.34px | 0.56px |
| `diagram-research-*`, `diagram-blocklist-*` | 480 | 480px (×1.00) | 1.50px | 1.12px |

The cards render one-to-one and carry the full 1.5px; only the full-width forms diagram
is scaled down. On a phone every asset thins out, the forms diagram to sub-pixel — an
accepted cost, because the diagrams are decorative, carry `alt=""`, and the caption
beneath each one carries the meaning.

The rule worth keeping is the one about authoring space: a full-column asset is drawn in
960-unit space, not 480. Drawing it at 480 and letting the column stretch it would
render the hairline at roughly 2.7px, nearly double the brand weight.

**No text inside the diagrams.** An SVG referenced through `<img>` cannot reach the
page's webfonts, so Playfair Display and JetBrains Mono would fall back to whatever the
renderer picks. Text in an image is also unselectable, untranslatable, invisible to
search, and lost to screen readers. All wording stays in Markdown, and each diagram is
followed by a visible caption in real text. The masthead is the single exception: it
exists to carry the brand typeface, and its glyphs are already outlined.

The diagrams are decorative and carry `alt=""`, because the caption and prose beside
them already say what they show. Nothing on the profile page exists only inside an
image. A decorative image is never wrapped in a link — an empty `alt` inside an anchor
leaves a link with no accessible name.

**Theme switching uses one mechanism across the whole page.** The masthead's
`gh-light-mode-only` / `gh-dark-mode-only` suffixes follow the reader's GitHub
appearance setting, including an explicit choice; `<picture>` with
`prefers-color-scheme` follows the operating system instead, and would disagree with
the masthead for any reader whose GitHub theme differs from their OS. Mixing the two
would show a light diagram under a dark masthead on the same screen, so the diagrams
use the same suffixes. On the masthead the suffix stays on the `<a href>`, because
hiding a linked image by its `src` would leave an empty link behind; on the unlinked
diagrams it goes on the `img src`. If GitHub ever removes these rules, the replacement
is `<picture>` with `<source media="(prefers-color-scheme: dark)">`, which the Markdown
sanitizer already allows.

To bust a cache, rename the file. Do not add a `?v=` query string.

The masthead `<img>` tags carry `width` but no `height`. GitHub's `.markdown-body img`
sets `max-width:100%` without `height:auto`, so a `height` attribute squashes the image
once the column is narrower than the asset.

**Not drawn, on purpose.** There is no diagram for Sic Semper Errata — artwork would
give a product marked "planned and not available for purchase" the same weight as the
services that are live. There is no seal or certificate mark beside the tax-exempt
statement; as `ARTWORK.md` puts it, the artwork must not imply official affiliation,
and an official-looking seal on a legal-aid page reads as government endorsement. No
number is ever baked into artwork.

**When changing a diagram**, edit both files of the pair, then run `tools/preview.mjs`
and look at the result at both widths in both themes. The counts in `profile/README.md`
sit between `form-counts` markers and are maintained by
`.github/workflows/refresh-form-counts.yml`; edit them through `tools/form-counts.mjs`
rather than by hand.
