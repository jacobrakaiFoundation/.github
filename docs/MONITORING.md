# Dependency and security monitoring

Foundation and personal repositories share one convention for dependency updates
and security scanning. Dependabot configuration is declared per repository —
GitHub does not inherit `dependabot.yml` from an organization profile repository —
so each repository carries its own file. Security scanning is centralized here as
a reusable workflow.

## The shared scanning workflow

`.github/workflows/security-scan.yml` in this repository is a `workflow_call`
workflow. Because this repository is public, any repository may call it.

```yaml
name: Security

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "17 6 * * 1"

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  scan:
    uses: jacobrakaiFoundation/.github/.github/workflows/security-scan.yml@main
    with:
      codeql-languages: '["javascript-typescript"]'
```

Inputs:

| Input | Default | Meaning |
| --- | --- | --- |
| `codeql-languages` | `"[]"` | JSON array of CodeQL languages. At the default, CodeQL does not run. |
| `codeql-build-mode` | `autobuild` | `autobuild`, `none`, or `manual`. Compiled languages need `autobuild` or `manual`. |
| `dependency-review` | `true` | Review dependency changes. The job runs on `pull_request` events only. |
| `fail-on-severity` | `high` | Severity at which dependency review fails the check. |

Two constraints apply. A caller grants permissions at the caller's level: a
reusable workflow can lower them but never raise them, so `security-events: write`
must appear in the calling workflow or CodeQL cannot upload results. And
`dependency-review` requires a public repository or GitHub Advanced Security;
on a private repository without it, set `dependency-review: false`.

The scheduled trigger matters as much as the scan. Without one, a dependency that
becomes vulnerable after the last commit is not surfaced until someone pushes.

## Dependabot convention

Weekly, Monday 09:00 `America/Los_Angeles`, labelled `dependencies`. Every
repository declares `github-actions` alongside its language ecosystems —
workflow actions are dependencies and are missed otherwise. Every directory
holding a manifest needs its own entry; Dependabot does not search recursively.

Pin actions to full commit SHAs with the version in a trailing comment. A
floating tag such as `@v4` resolves to whatever that tag currently points at.
Once pinned, Dependabot proposes SHA bumps and rewrites the comment.

## Audit — 11 September 2026

Public repositories, read directly. Private repositories were not reachable from
the session that produced this file and are unaudited.

| Repository | Dependabot ecosystems | Scheduled run | Scanning |
| --- | --- | --- | --- |
| `jacobyoby/honeypot-blocklist` | gomod, github-actions | yes | none |
| `jacobyoby/nodary` | uv, github-actions | no | none |
| `jacobyoby/culk` | npm, github-actions | no | none |
| `jacobyoby/beanstalk` | npm `/food-recall-app`, github-actions | no | none |
| `jacobyoby/PSNetMap` | github-actions | no | none |
| `jacobyoby/mewtoo` | pip | no | none |
| `jacobyoby/claude-orgtree` | npm `/frontend`, github-actions | no | none |
| `jacobyoby/jacobyoby` | none — profile repository, no code | — | — |
| `jacobrakaiFoundation/.github` | github-actions | no | none |

No repository ran CodeQL, dependency review, or any vulnerability audit.
`honeypot-blocklist` alone ran on a schedule, and alone pinned its actions to
commit SHAs.

Forks tracking upstream projects — `docassemble`, `Auto-GPT`, `jusText` — are
outside this convention.

## Outstanding changes

These repositories could not be written to from the session that produced this
file. Each change is additive to the existing `.github/dependabot.yml`.

**`jacobyoby/mewtoo`** — no `github-actions` entry, so the actions in `ci.yml`
never receive updates. Append:

```yaml
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
      timezone: America/Los_Angeles
    open-pull-requests-limit: 3
    labels:
      - dependencies
```

**`jacobyoby/culk`** — `Dockerfile` and `Dockerfile.dev` at the root are
unmonitored. Append:

```yaml
  - package-ecosystem: docker
    directory: "/"
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
      timezone: America/Los_Angeles
    open-pull-requests-limit: 3
    labels:
      - dependencies
```

**`jacobyoby/claude-orgtree`** — configuration covers `/frontend` only. The root
`requirements.txt`, `hub/requirements.txt`, `sandbox/Dockerfile`, and
`hub/Dockerfile` are unmonitored. Append `pip` entries for `/` and `/hub`, and
`docker` entries for `/sandbox` and `/hub`, on the same schedule. This repository
is a fork; lower priority than the two above.

Beyond Dependabot: adopt the calling workflow above in `culk`, `beanstalk`, and
`claude-orgtree` with `codeql-languages: '["javascript-typescript"]'`; in
`mewtoo` and `nodary` with `'["python"]'`; and in `honeypot-blocklist` with
`'["go"]'`. `PSNetMap` is PowerShell, which CodeQL does not support — dependency
review and the existing CI are the coverage available there.
