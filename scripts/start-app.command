#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
RUN_DIR="$SCRIPT_DIR/.run"
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
APP_URL="http://localhost:5174/invoice"

mkdir -p "$RUN_DIR" "$LOG_DIR"

fail() {
  echo
  echo "エラー: $1"
  echo "このウィンドウを閉じるにはEnterキーを押してください。"
  read -r
  exit 1
}

is_running() {
  [ -f "$1" ] || return 1
  local pid
  pid="$(tr -d '[:space:]' < "$1")"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local count=0
  while [ "$count" -lt 60 ]; do
    if curl --silent --fail --output /dev/null "$url"; then
      return 0
    fi
    sleep 0.5
    count=$((count + 1))
  done
  fail "$nameを起動できませんでした。scripts/logsのログを確認してください。"
}

echo "薬局請求書アプリを起動しています..."

CONDA_BIN="$(command -v conda 2>/dev/null || true)"
if [ -z "$CONDA_BIN" ]; then
  for candidate in \
    "/opt/homebrew/bin/conda" \
    "/usr/local/bin/conda" \
    "$HOME/miniconda3/bin/conda" \
    "$HOME/anaconda3/bin/conda"; do
    if [ -x "$candidate" ]; then
      CONDA_BIN="$candidate"
      break
    fi
  done
fi
[ -n "$CONDA_BIN" ] || fail "condaが見つかりません。MinicondaまたはAnacondaをインストールしてください。"

BACKEND_PYTHON="$("$CONDA_BIN" run -n devenv python -c 'import sys; print(sys.executable)' 2>/dev/null | tail -n 1)"
[ -x "$BACKEND_PYTHON" ] || fail "conda環境 devenv が見つかりません。devenvを作成してください。"

if ! "$BACKEND_PYTHON" -c "import fastapi, uvicorn, sqlalchemy, dotenv" >/dev/null 2>&1; then
  echo "初回準備: devenvへバックエンドの依存関係をインストールしています..."
  "$BACKEND_PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt" || fail "devenvへバックエンドの依存関係をインストールできませんでした。"
fi

command -v node >/dev/null 2>&1 || fail "Node.jsが見つかりません。Node.jsをインストールしてください。"
command -v npm >/dev/null 2>&1 || fail "npmが見つかりません。Node.jsをインストールしてください。"

if [ ! -f "$FRONTEND_DIR/node_modules/vite/bin/vite.js" ]; then
  echo "初回準備: フロントエンド環境を作成しています..."
  (cd "$FRONTEND_DIR" && npm install) || fail "フロントエンドの依存関係をインストールできませんでした。"
fi

if ! is_running "$BACKEND_PID_FILE"; then
  rm -f "$BACKEND_PID_FILE"
  (
    cd "$BACKEND_DIR" || exit 1
    nohup "$BACKEND_PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
  ) || fail "バックエンドを起動できませんでした。"
fi

if ! is_running "$FRONTEND_PID_FILE"; then
  rm -f "$FRONTEND_PID_FILE"
  (
    cd "$FRONTEND_DIR" || exit 1
    nohup node "$FRONTEND_DIR/node_modules/vite/bin/vite.js" > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
  ) || fail "フロントエンドを起動できませんでした。"
fi

wait_for_url "http://127.0.0.1:8000/docs" "バックエンド"
wait_for_url "http://localhost:5174/invoice" "フロントエンド"

echo "起動しました。ブラウザを開きます。"
open "$APP_URL" || fail "ブラウザを開けませんでした。$APP_URL を手動で開いてください。"
exit 0
