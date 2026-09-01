#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUN_DIR="$SCRIPT_DIR/.run"

stop_process() {
  local name="$1"
  local pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    echo "$nameは起動していません。"
    return
  fi

  local pid
  pid="$(tr -d '[:space:]' < "$pid_file")"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    local count=0
    while kill -0 "$pid" 2>/dev/null && [ "$count" -lt 20 ]; do
      sleep 0.25
      count=$((count + 1))
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null
    fi
    echo "$nameを停止しました。"
  else
    echo "$nameはすでに停止しています。"
  fi
  rm -f "$pid_file"
}

echo "薬局請求書アプリを停止しています..."
stop_process "フロントエンド" "$RUN_DIR/frontend.pid"
stop_process "バックエンド" "$RUN_DIR/backend.pid"
echo "停止しました。"
sleep 1
