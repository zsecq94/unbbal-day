#!/bin/sh
# 시안 검증: 저장소 루트를 http로 띄우고(폰트를 node_modules에서 읽기 위해)
# 헤드리스 크롬으로 verify.mjs를 돌린다. TOOL=locale-perf면 언어 전환 검사를 돌린다.
# 사용: sh mockups/tools/run.sh [샘플 필터] [--sizes=...] [--shots=DIR]
#       TOOL=locale-perf sh mockups/tools/run.sh [대상 필터] [--runs=3] [--app=URL]
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TOOLS=/tmp/mock-tools
PORT=8765

if [ ! -d "$TOOLS/node_modules/puppeteer-core" ]; then
  mkdir -p "$TOOLS"
  (cd "$TOOLS" && npm init -y >/dev/null && npm i puppeteer-core --silent)
fi

if ! curl -s -o /dev/null "http://127.0.0.1:$PORT/mockups/index.html"; then
  (cd "$ROOT" && python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/mock-http.log 2>&1 &)
  sleep 1
fi

node "$ROOT/mockups/tools/${TOOL:-verify}.mjs" "$@"
