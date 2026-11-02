# .github (Jacob Rakai Foundation organization profile)

The organization's front door: `profile/README.md` is what github.com/jacobrakaiFoundation shows, plus the shared security-scan workflow other repos call. Almost nothing here is code; most changes are facts, links and brand rules.

| Path | What |
|---|---|
| `profile/` | The profile README and its SVG/WebP images (served from the default branch) |
| `docs/BRAND.md`, `ARTWORK.md`, `LEGAL.md` | Brand, artwork and legal rules the profile must follow |
| `docs/MONITORING.md` | Shared Dependabot and security-scan convention; `.github/workflows/security-scan.yml` is the reusable workflow |
| `tools/` | Form-count refresh, masthead outliner, local preview, commit-cleaner |

## Test

```bash
node --test tools/form-counts.test.mjs     # 13 tests, no dependencies; what CI runs
tools/commit-cleaner/test.sh               # commit-cleaner hooks; CI: commit-cleaner-tests.yml
node tools/form-counts.mjs --check         # compares profile counts to the live catalogue; needs network, exit 1 on drift
```

## Preview before pushing

GitHub has no preview for org profiles, and images load from the default branch, so a PR shows them broken.

```bash
cd tools && npm install
node preview.mjs out/shot      # desktop and mobile shots, both themes, plus an images-blocked pass
```

Re-outline the masthead after the website homepage `<h1>` changes: `node tools/masthead.mjs <playfair-display-regular.woff2>` (details in the script header).

## Release

Merging to `main` is the deploy; GitHub serves the profile from the default branch. `refresh-form-counts.yml` opens a PR on `automation/form-counts` when the catalogue counts change. Merging is Jacob's.

Checklist for a profile change:

1. Edit `profile/README.md` (and images); keep within `docs/BRAND.md` and `docs/LEGAL.md`.
2. `node --test tools/form-counts.test.mjs`, then `node tools/preview.mjs out/shot` and look at the mobile shots for horizontal overflow.
3. Open a PR; the Claude review workflow checks facts and links.
4. After merge, open the org page and check the served result, not the diff.
