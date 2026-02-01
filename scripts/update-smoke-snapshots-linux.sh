#!/usr/bin/env bash
# 그룹 C: WSL(Linux) 환경에서 smoke 시각적 회귀 스냅샷 갱신
# → home-page-initial-chromium-linux.png 생성 (CI e2e-critical 통과용)
#
# 사용법: WSL Ubuntu 터미널에서 프로젝트 루트로 이동 후
#   bash scripts/update-smoke-snapshots-linux.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "[1/4] Node 버전 확인 (권장: 22.x)..."
if command -v node &>/dev/null; then
  node -v
else
  echo "Node가 설치되어 있지 않습니다. docs/ci-group-c-wsl-smoke-snapshots.md 2단계를 참고해 Node 22를 설치한 뒤 다시 실행하세요."
  exit 1
fi

echo "[2/4] npm install --legacy-peer-deps..."
npm install --legacy-peer-deps

echo "[3/4] Playwright Chromium 및 시스템 의존성 설치 (sudo 비밀번호 필요할 수 있음)..."
npx playwright install --with-deps chromium

echo "[4/4] smoke.spec.ts --update-snapshots 실행..."
npm run test:e2e:critical -- tests/e2e/smoke.spec.ts --update-snapshots

SNAPSHOT="tests/e2e/snapshots/smoke.spec.ts-snapshots/home-page-initial-chromium-linux.png"
if [ -f "$SNAPSHOT" ]; then
  echo "완료: $SNAPSHOT 생성됨. 이 파일을 커밋하면 CI(e2e-critical) smoke 시각적 회귀가 통과합니다."
else
  echo "경고: $SNAPSHOT 이 생성되지 않았을 수 있습니다. 위 테스트 로그를 확인하세요."
  exit 1
fi
