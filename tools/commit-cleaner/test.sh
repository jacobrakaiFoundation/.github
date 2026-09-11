#!/bin/sh
# Tests for the commit-msg hook, the installer, and the PreToolUse guard.
# Run: tools/commit-cleaner/test.sh   (needs git and python3)
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
fails=0
pass() { printf 'ok   %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1"; fails=$((fails+1)); }

# ---- hook: message rewriting -------------------------------------------
run_hook() { printf '%b' "$1" > "$work/msg"; "$here/commit-msg" "$work/msg"; cat "$work/msg"; }

out=$(run_hook 'feat: add thing\n\nBody line.\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01ABC\n')
[ "$out" = "$(printf 'feat: add thing\n\nBody line.')" ] && pass "strips trailers and trailing blanks" || { fail "strips trailers: got [$out]"; }

out=$(run_hook 'fix: x\n\nCo-Authored-By: Jane Doe <jane@example.org>\nCo-Authored-By: claude <noreply@anthropic.com>\n')
[ "$out" = "$(printf 'fix: x\n\nCo-Authored-By: Jane Doe <jane@example.org>')" ] && pass "keeps human co-authors" || fail "keeps human co-authors: [$out]"

out=$(run_hook 'docs: y\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nhttps://claude.ai/code/session_01MU3X\n')
[ "$out" = "docs: y" ] && pass "strips generated-with footer and bare session URL" || fail "footer: [$out]"

printf 'chore: clean message\n\nNothing to see.\n\n# comment line\n' > "$work/msg"; cp "$work/msg" "$work/orig"
"$here/commit-msg" "$work/msg"
cmp -s "$work/msg" "$work/orig" && pass "clean message is byte-identical" || fail "clean message modified"

printf 'Co-Authored-By: Claude <noreply@anthropic.com>\n' > "$work/msg"
"$here/commit-msg" "$work/msg"; [ ! -s "$work/msg" ] && pass "attribution-only message becomes empty (git then aborts the commit)" || fail "attribution-only"

"$here/commit-msg" "$work/does-not-exist" && pass "missing file exits 0" || fail "missing file"

# ---- hook: end to end in a real repository -----------------------------
repo="$work/repo"; git init -q "$repo"; cd "$repo"
git config user.name t; git config user.email t@example.org; git config commit.gpgsign false
"$here/install.sh" "$repo" >/dev/null
echo a > a; git add a
git commit -q -m "first" -m "Co-Authored-By: Claude Opus <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_x"
[ "$(git log -1 --format=%B)" = "first" ] && pass "installed hook cleans a real commit" || fail "real commit: [$(git log -1 --format=%B)]"

# chaining a pre-existing hook
repo2="$work/repo2"; git init -q "$repo2"; cd "$repo2"
git config user.name t; git config user.email t@example.org; git config commit.gpgsign false
printf '#!/bin/sh\necho chained-ran > "%s/chained"\n' "$work" > .git/hooks/commit-msg; chmod +x .git/hooks/commit-msg
"$here/install.sh" >/dev/null
echo b > b; git add b; git commit -q -m "second" -m "Claude-Session: https://claude.ai/code/session_y"
[ -f "$work/chained" ] && [ "$(git log -1 --format=%B)" = "second" ] && pass "chains an existing commit-msg hook" || fail "chain"
"$here/install.sh" --uninstall >/dev/null
grep -q chained-ran .git/hooks/commit-msg && pass "uninstall restores the previous hook" || fail "uninstall restore"

# ---- hook: core.hooksPath (.githooks) layout ---------------------------
repo3="$work/repo3"; git init -q "$repo3"; cd "$repo3"
git config user.name t; git config user.email t@example.org; git config commit.gpgsign false
mkdir .githooks; cp "$here/commit-msg" .githooks/; git config core.hooksPath .githooks
echo c > c; git add c; git commit -q -m "third" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
[ "$(git log -1 --format=%B)" = "third" ] && pass "works via core.hooksPath=.githooks" || fail "hooksPath"

# ---- guard --------------------------------------------------------------
guard() { printf '{"tool_name":"Bash","tool_input":{"command":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1")" | python3 "$here/guard.py" 2>/dev/null; }
allow() { guard "$1" && pass "guard allows: $1" || fail "guard wrongly blocked: $1"; }
block() { if guard "$1"; then fail "guard wrongly allowed: $1"; else pass "guard blocks: $1"; fi; }
allow 'git commit -m "normal"'
allow 'git add -A && git commit -am "msg" && git push -u origin b'
allow 'git commit -m "note: we no longer use --no-verify anywhere"'
allow 'git log --oneline -n 5'
allow 'npm test'
block 'git commit --no-verify -m x'
block 'git commit --no-verif -m x'
block 'git commit -n -m x'
block 'git commit -anm x'
block 'git -c core.hooksPath=/dev/null commit -m x'
block 'HOME=/tmp git commit -m x'
block 'bash -c "git commit -n -m x"'
block 'eval "git commit --no-verify -m x"'
block 'git config core.hooksPath /nowhere'
block 'rm .git/hooks/commit-msg'
block 'echo "$(git commit -n -m x)"'

echo
[ "$fails" -eq 0 ] && echo "all tests passed" || { echo "$fails test(s) failed"; exit 1; }
