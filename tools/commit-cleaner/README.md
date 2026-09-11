# commit-cleaner

Keeps Claude Code's attribution out of Git history. Claude Code appends
`Co-Authored-By: Claude … <noreply@anthropic.com>` and `Claude-Session: …`
trailers to every commit it makes. These scripts strip them at commit time,
stop the hook being bypassed from inside a Claude Code session, and scrub
commits that already carry them.

| File | Purpose |
| --- | --- |
| `commit-msg` | Git `commit-msg` hook. Removes the attribution lines; leaves everything else byte-identical. |
| `install.sh` | Copies the hook into a repository, or into a global hooks directory for every repository. Chains any hook already there. |
| `guard.py` | Claude Code `PreToolUse` hook. Refuses `git commit --no-verify`, `-n`, `core.hooksPath` overrides, and edits to the hook itself. |
| `clean-history.sh` | `git filter-repo` wrapper for commits that already have the trailers. Dry-run by default. |
| `claude-settings.example.json` | Drop-in `.claude/settings.json` for a repository that vendors the hook under `.githooks/`. |
| `test.sh` | Tests for all of the above. |

## What is removed

* `Co-Authored-By:` lines whose address is `@anthropic.com`, or whose name starts with `Claude`
* `Claude-Session:` lines
* `Generated with [Claude Code](…)` footers, with or without the emoji
* bare `https://claude.ai/code/session_…` lines

Human `Co-Authored-By:` trailers are kept. A message that is nothing but
attribution becomes empty, so Git aborts that commit rather than recording an
empty message.

## Option 1: one repository

```sh
tools/commit-cleaner/install.sh /path/to/repo
```

This copies the hook into that repository's hooks directory (honouring
`core.hooksPath` and worktrees). Re-run to update. `--uninstall` removes it and
restores any hook it chained.

## Option 2: every repository on this machine

```sh
tools/commit-cleaner/install.sh --global
```

Sets `core.hooksPath` to `~/.config/git/hooks` (or uses the one already set)
and installs the hook there. Note that a global `core.hooksPath` makes Git
ignore each repository's own `.git/hooks/`, so move any such hooks into the
global directory.

## Option 3: checked into a repository, active in Claude Code sessions

For repositories worked on through Claude Code on the web, where each session
is a fresh clone with no hooks installed:

1. Copy `commit-msg` to `.githooks/commit-msg` in the repository.
2. Copy `guard.py` to `.claude/hooks/commit-guard.py`.
3. Copy `claude-settings.example.json` to `.claude/settings.json`.

The `SessionStart` hook points `core.hooksPath` at `.githooks/` at the start of
every session, and the `PreToolUse` hook blocks bypasses. Contributors working
locally run `git config core.hooksPath .githooks` once. `beanstalk` and
`docassemble` are set up this way.

## Scrubbing existing commits

```sh
pip install git-filter-repo
tools/commit-cleaner/clean-history.sh -n 5          # dry run: shows what would change
tools/commit-cleaner/clean-history.sh -n 5 --force  # rewrite HEAD~5..HEAD
```

This rewrites history. Every affected commit gets a new hash; a branch that was
already pushed needs `git push --force-with-lease`, and anyone who has the old
commits must rebase. Make a backup branch first. On a shared branch, prefer
leaving history alone and relying on the hook from now on.

## Limits

* The hook runs only on `git commit`. `cherry-pick`, `rebase`, and
  `commit --amend` without an edited message replay the stored message.
* GitHub's squash-merge box is composed in the browser and is not covered.
* The guard unwraps one layer of `bash -c`, `eval`, `$(…)`, and backticks. It
  is a speed bump, not a sandbox; the `commit-msg` hook is the real control.
* Branch protection cannot enforce trailer content. If a clean history must be
  guaranteed, add a CI check that greps `git log` on pull requests.

Based on the approach in [ya8282/commit-cleaner-hook](https://github.com/ya8282/commit-cleaner-hook),
reimplemented here so the foundation's repositories do not depend on a
third-party plugin.
