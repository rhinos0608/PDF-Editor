#!/usr/bin/env bash
# File: router/run_three_agents_pdf_editor.sh
# Usage: ./router/run_three_agents_pdf_editor.sh "Describe the PDF Editor task here"

set -euo pipefail

# -------- CONFIGURATION --------
# CLI commands for each agent
GEMINI_CMD="gemini -p"
CODEX_CMD="codex --model code-davinci-002 --prompt"
CLAUDE_CMD="claude --prompt"

# Where to drop outputs
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$PROJECT_ROOT/suggestions"
mkdir -p "$OUT_DIR"

# Timestamp for filenames (e.g. 20250815_000120)
TS=$(date +"%Y%m%d_%H%M%S")

# -------- INPUT HANDLING --------
if [ $# -lt 1 ]; then
  echo "Error: No prompt provided."
  echo "Usage: $0 \"Fix the PDF viewer text-selection bug\""
  exit 1
fi
PROMPT="$*"

echo
echo "🚀 Dispatching PDF Editor task at $(date +'%F %T')..."
echo "   Prompt: \"$PROMPT\""
echo

# -------- FAN-OUT VIA tee() --------
# Echo the prompt once, tee into Gemini and Codex, and pipe the final branch to Claude.
echo "$PROMPT" \
  | tee \
      >($GEMINI_CMD "$PROMPT" > "$OUT_DIR/gemini_$TS.txt") \
      >($CODEX_CMD "$PROMPT" > "$OUT_DIR/codex_$TS.txt") \
  | $CLAUDE_CMD "$PROMPT" > "$OUT_DIR/claude_$TS.txt"

# -------- SUMMARY --------
echo
echo "✅ Agents complete. Outputs:"
echo "   • Gemini: $OUT_DIR/gemini_$TS.txt"
echo "   • Codex:  $OUT_DIR/codex_$TS.txt"
echo "   • Claude: $OUT_DIR/claude_$TS.txt"
echo

# Combine into one summary for easy review
SUMMARY="$OUT_DIR/combined_$TS.txt"
{
  echo "=== GEMINI ($TS) ==="
  cat "$OUT_DIR/gemini_$TS.txt"
  echo
  echo "=== CODEX ($TS) ==="
  cat "$OUT_DIR/codex_$TS.txt"
  echo
  echo "=== CLAUDE ($TS) ==="
  cat "$OUT_DIR/claude_$TS.txt"
} > "$SUMMARY"

echo "🔗 Combined summary: $SUMMARY"
echo