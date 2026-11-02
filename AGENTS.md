# jacobrakaiFoundation/.github

The organization's front door and shared configuration. Almost nothing here is
application code, but several files reach every other Foundation repository.

| Path | What it is |
| --- | --- |
| `profile/README.md` | The org page at https://github.com/jacobrakaiFoundation |
| `profile/*.svg` | Masthead and diagrams; rules in `docs/BRAND.md` |
| `SECURITY.md` | Security policy for every repository in the org |
| `.github/workflows/security-scan.yml` | Reusable scan that other repositories call (`docs/MONITORING.md`) |
| `tools/commit-cleaner/` | Commit hook copied into other repositories |
| `tools/form-counts.mjs` | Rewrites the form-count block in `profile/README.md` |

## Commands

```bash
tools/commit-cleaner/test.sh             # commit-cleaner tests (git, python3)
node tools/form-counts.test.mjs          # form-counts parser fixtures
node tools/form-counts.mjs --check       # live counts vs the README; exit 1 on drift
cd tools && npm install && cd .. && node tools/preview.mjs out/shot   # screenshots before pushing
```

## Rules

- Merging to `main` publishes the org page and changes the shared workflow for every
  caller at once, so a merge needs Jacob's yes.
- Do not hand-edit the numbers between the `form-counts` markers. The monthly
  `refresh-form-counts.yml` run opens a pull request when they drift.
- Pin actions to full commit SHAs with the version in a trailing comment
  (`docs/MONITORING.md`).
