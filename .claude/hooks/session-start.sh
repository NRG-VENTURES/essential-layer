#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install HTML validation and CSS linting tools
npm install --no-fund --no-audit htmlhint 2>/dev/null || true
