#!/bin/sh
# Rewrite recent commits to remove Claude Code attribution from their messages.
#
#   clean-history.sh [-n COUNT | --range REV..REV] [--force]
#
# Defaults to the last 5 commits on the current branch (HEAD~5..HEAD). Prints
# what it would do and refuses to run without --force, because this REWRITES
# HISTORY: every commit in the range gets a new hash, and anyone who has the
# old commits must rebase onto the rewritten branch. Never run it on a branch
# other people have based work on unless they know it is coming.
#
# Requires git-filter-repo (https://github.com/newren/git-filter-repo):
#   pip install git-filter-repo   or   brew install git-filter-repo
#
# For commits not yet pushed anywhere, this is the tool. For anything already
# on a shared branch, prefer leaving history alone and installing the hook.

set -eu

count=5
range=""
force=0
while [ $# -gt 0 ]; do
    case "$1" in
        -n)        count=$2; shift ;;
        --range)   range=$2; shift ;;
        --force)   force=1 ;;
        -h|--help) sed -n '2,17p' "$0"; exit 0 ;;
        *) printf 'clean-history.sh: unknown argument %s\n' "$1" >&2; exit 1 ;;
    esac
    shift
done

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "not inside a git repository" >&2; exit 1; }
command -v git-filter-repo >/dev/null 2>&1 || git filter-repo --version >/dev/null 2>&1 \
    || { echo "git-filter-repo is not installed (pip install git-filter-repo)" >&2; exit 1; }

if [ -n "$(git status --porcelain)" ]; then
    echo "working tree is not clean; commit or stash first" >&2; exit 1
fi

if [ -z "$range" ]; then
    total=$(git rev-list --count HEAD)
    if [ "$total" -le "$count" ]; then
        range="HEAD"           # whole (short) history
    else
        range="HEAD~$count..HEAD"
    fi
fi

branch=$(git symbolic-ref --short -q HEAD || echo "(detached)")
echo "branch:  $branch"
echo "range:   $range"
echo "commits carrying attribution in range:"
git log --format='  %h %s' --grep='Co-Authored-By: Claude' --grep='Claude-Session:' --grep='anthropic.com' --grep='Generated with \[Claude Code\]' -i "$range" || true
echo

if [ "$force" -ne 1 ]; then
    echo "dry run. Re-run with --force to rewrite these commits."
    echo "Back up first:  git branch backup/pre-clean-$(date +%Y%m%d)"
    exit 0
fi

# filter-repo insists on a fresh clone unless told otherwise; --refs limits the
# rewrite to the chosen range so the rest of history keeps its hashes.
git filter-repo --force --refs "$range" --message-callback '
import re
msg = message.decode("utf-8", "surrogateescape")
pat = re.compile(
    r"^(Co-Authored-By:\s*(Claude\b[^\n]*|[^\n]*<[^>\n]*@anthropic\.com>)"
    r"|Claude-Session:[^\n]*"
    r"|[^\n]*Generated with \[Claude Code\]\([^\n]*"
    r"|\s*https://claude\.ai/code/session_[A-Za-z0-9_-]+\s*)$\n?",
    re.IGNORECASE | re.MULTILINE,
)
new = pat.sub("", msg)
if new != msg:
    new = new.rstrip("\n") + "\n"
return new.encode("utf-8", "surrogateescape")
'
echo
echo "done. Rewritten commits:"
git log --oneline -"$count"
echo "If the branch was already pushed:  git push --force-with-lease"
