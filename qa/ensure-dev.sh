#!/bin/bash
# Ensure the Roycss dev server is listening on :3000.
# Safe to call at the top of EVERY Bash call (sandbox reaps background
# processes between tool calls). Warm .next cache makes restarts fast.
set -u
if curl -s -o /dev/null -m 3 http://localhost:3000/effects; then
  exit 0
fi
cd /home/z/roycss || exit 1
env -u DATABASE_URL -u PORT setsid nohup bun run dev > /home/z/roycss/dev-server.log 2>&1 < /dev/null &
for _ in $(seq 1 90); do
  sleep 2
  if curl -s -o /dev/null -m 5 http://localhost:3000/effects; then
    # warm the heavy home route too (best-effort, don't block on failure)
    curl -s -o /dev/null -m 120 http://localhost:3000/ &
    exit 0
  fi
done
echo "dev server failed to become ready" >&2
exit 1
