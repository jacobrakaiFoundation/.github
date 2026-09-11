#!/bin/sh
# Install the commit-cleaner commit-msg hook.
#
#   install.sh                 install into the current repository (.git/hooks)
#   install.sh /path/to/repo   install into that repository
#   install.sh --global        install for every repository of this user via a
#                              hooks directory at ~/.config/git/hooks and
#                              core.hooksPath (existing global hooksPath is
#                              respected and the hook is placed there instead)
#   install.sh --uninstall [repo|--global]
#
# The hook is copied, not symlinked, so a repository keeps working when this
# checkout moves. Re-running the installer updates the copy. If a commit-msg
# hook already exists and is not ours, it is preserved and chained: our hook
# runs first, then the original.

set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
src="$here/commit-msg"
marker="commit-cleaner"

die() { printf 'install.sh: %s\n' "$*" >&2; exit 1; }

hooks_dir_for_repo() {
    repo=$1
    git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
        || die "$repo is not a git repository"
    # Honors core.hooksPath (repo or global) and worktrees alike.
    git -C "$repo" rev-parse --path-format=absolute --git-path hooks
}

install_into() {
    dir=$1
    mkdir -p "$dir"
    target="$dir/commit-msg"
    if [ -f "$target" ] && ! grep -q "$marker" "$target"; then
        # Preserve a foreign hook and chain to it.
        mv "$target" "$dir/commit-msg.pre-commit-cleaner"
        {
            cat "$src"
            printf '\n# --- chained by commit-cleaner: run the hook that was here before ---\n'
            printf 'exec "$(dirname -- "$0")/commit-msg.pre-commit-cleaner" "$@"\n'
        } > "$target"
        # The copied hook ends in `exit 0`; drop that line so the chain runs.
        sed -i.bak '/^exit 0$/d' "$target" && rm -f "$target.bak"
        printf 'chained existing commit-msg hook as %s\n' "$dir/commit-msg.pre-commit-cleaner"
    else
        cp "$src" "$target"
    fi
    chmod +x "$target"
    printf 'installed %s\n' "$target"
}

uninstall_from() {
    dir=$1
    target="$dir/commit-msg"
    [ -f "$target" ] || { printf 'nothing installed at %s\n' "$target"; return; }
    grep -q "$marker" "$target" || die "$target is not the commit-cleaner hook; leaving it alone"
    rm -f "$target"
    if [ -f "$dir/commit-msg.pre-commit-cleaner" ]; then
        mv "$dir/commit-msg.pre-commit-cleaner" "$target"
        printf 'restored previous hook at %s\n' "$target"
    else
        printf 'removed %s\n' "$target"
    fi
}

mode=install
target_arg=""
for a in "$@"; do
    case "$a" in
        --uninstall) mode=uninstall ;;
        --global)    target_arg=--global ;;
        -h|--help)   sed -n '2,16p' "$0"; exit 0 ;;
        -*)          die "unknown option $a" ;;
        *)           target_arg=$a ;;
    esac
done

if [ "$target_arg" = "--global" ]; then
    hp=$(git config --global --get core.hooksPath || true)
    if [ -z "$hp" ]; then
        hp="${XDG_CONFIG_HOME:-$HOME/.config}/git/hooks"
        if [ "$mode" = install ]; then
            git config --global core.hooksPath "$hp"
            printf 'set global core.hooksPath to %s\n' "$hp"
            printf 'note: repositories with their own .git/hooks/* scripts now need those moved into %s\n' "$hp"
        fi
    fi
    case "$hp" in "~"*) hp="$HOME${hp#\~}" ;; esac
    if [ "$mode" = install ]; then install_into "$hp"; else uninstall_from "$hp"; fi
else
    repo=${target_arg:-.}
    dir=$(hooks_dir_for_repo "$repo")
    if [ "$mode" = install ]; then install_into "$dir"; else uninstall_from "$dir"; fi
fi
