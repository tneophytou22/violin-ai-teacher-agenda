#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/v15"

PORT="$(python3 - <<'PY'
import socket
s=socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"

URL="http://127.0.0.1:${PORT}/ui/demo/"
LOG="/tmp/violin-ai-teacher-agenda-v15.log"

echo "Starting Violin AI Teacher Agenda V15..."
echo "Opening: $URL"

python3 -m http.server "$PORT" --bind 127.0.0.1 >"$LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 0.5
open "$URL"

echo
echo "V15 is running."
echo "Keep this Terminal window open while using the app."
echo "Close this window to stop the local server."
echo
wait "$SERVER_PID"
