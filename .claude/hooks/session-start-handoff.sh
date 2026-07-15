#!/usr/bin/env bash
# SessionStart hook: if HANDOFF.md exists, inject its contents into the
# model's context automatically so it picks up where the other machine left off.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

if [ -f HANDOFF.md ]; then
  content=$(cat HANDOFF.md)
  jq -n --arg ctx "Resuming this repo — possibly on a different machine than last time. Contents of HANDOFF.md:

$content" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$ctx}}'
else
  exit 0
fi
