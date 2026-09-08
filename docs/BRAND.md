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
