#!/usr/bin/env bash
# Stop hook: if the repo has uncommitted changes when Claude finishes a turn,
# block the stop and make Claude write/update HANDOFF.md and push before
# actually stopping. No-op when the tree is already clean.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  cat <<'EOF'
{"decision":"block","reason":"There are uncommitted changes in this repo. Before stopping: (1) write or update HANDOFF.md at the repo root with a short summary of what changed this session, the current state of the work, and what to pick up next — this is read automatically on the other machine (Mac/Windows desktop) to resume context; (2) run: git add -A && git commit -m \"handoff: <one-line summary>\" && git push. Then stop."}
EOF
else
  exit 0
fi
