#!/usr/bin/env bash
# CI 로컬 풀 런: .github/workflows/ci.yml과 같은 순서로 job/step 실행
# Secrets는 환경 변수로 설정 (예: .env 로드 또는 export VITE_SUPABASE_URL=...)
#
# 사용법:
#   bash scripts/ci-local-full.sh
#   CI_SKIP_DB=1 bash scripts/ci-local-full.sh   # security-db 단계 건너뛰기
#   CI_SKIP_E2E=1 bash scripts/ci-local-full.sh   # e2e-critical 건너뛰기

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# --- GitHub 전용 (로컬에서는 해당 없음) ---
# - Checkout code (actions/checkout)
# - Setup Node.js (actions/setup-node, cache: 'npm')
# - Cache node_modules / Restore node_modules (actions/cache)
# - Upload build artifacts / Upload Test Reports (actions/upload-artifact)
# - Download build artifacts (actions/download-artifact)

echo "=== 1. setup (의존성 설치) ==="
# [GitHub] Checkout code
# [GitHub] Setup Node.js 22, cache npm
# [GitHub] Restore node_modules from cache (cache-miss 시 아래 실행)
echo "[setup] Install dependencies..."
npm install --legacy-peer-deps

echo "=== 2. validate (코드 품질 및 타입 체크) ==="
# [GitHub] env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
echo "[validate] Type check..."
npm run type-check
echo "[validate] Lint..."
npm run lint
echo "[validate] Format check..."
npm run format:check
echo "[validate] Security Shield (Secrets)..."
npm run check:secrets
echo "[validate] Circular Dependency Check..."
npm run check:circular
echo "[validate] Code Integrity (Spell & Magic & CSS)..."
npm run check:integrity
echo "[validate] Logic Leash (Performance)..."
npm run check:logic
echo "[validate] Benchmark Tests..."
npm run test:bench

echo "=== 3. unit-test (단위 테스트) ==="
# [GitHub] env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# [GitHub] 실패 시 Upload Test Reports (actions/upload-artifact)
mkdir -p reports
echo "[unit-test] Run Unit Tests..."
npm run test:all -- --reporter=default --reporter=junit --outputFile=reports/test-results.xml

echo "=== 4. security-db (선택: DB 및 보안 검증) ==="
if [ -n "${CI_SKIP_DB}" ]; then
  echo "[security-db] Skipped (CI_SKIP_DB=1)."
else
  echo "[security-db] Security audit..."
  npm run check:security

  if [ -z "${SUPABASE_DB_PASSWORD}" ] || [ -z "${SUPABASE_ACCESS_TOKEN}" ] || [ -z "${VITE_SUPABASE_URL}" ]; then
    echo "[security-db] SUPABASE_DB_PASSWORD / SUPABASE_ACCESS_TOKEN / VITE_SUPABASE_URL 미설정 — Validate required secrets, DB Lint, DB validation 건너뜀."
    echo "  로컬에서 실행하려면: export SUPABASE_DB_PASSWORD=... SUPABASE_ACCESS_TOKEN=... VITE_SUPABASE_URL=..."
  else
    echo "[security-db] Validate required secrets (env 확인됨)..."
    # [GitHub] 🔐 Validate required secrets (스크립트 내 검증)
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
    if [ -z "$PROJECT_REF" ] || [ "$PROJECT_REF" = "$VITE_SUPABASE_URL" ]; then
      echo "Error: Failed to extract project ref from VITE_SUPABASE_URL"
      exit 1
    fi
    echo "[security-db] DB Lint Check (supabase link + db lint)..."
    npx supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
    npx supabase db lint --linked --fail-on error
    echo "[security-db] DB validation..."
    npm run check:db:validation
  fi
fi

echo "=== 5. build (빌드) ==="
# [GitHub] Build 후 Upload build artifacts
echo "[build] Build project..."
npm run build

echo "=== 6. e2e-critical (선택: E2E 핵심 경로) ==="
if [ -n "${CI_SKIP_E2E}" ]; then
  echo "[e2e-critical] Skipped (CI_SKIP_E2E=1)."
else
  echo "[e2e-critical] Install Playwright Browsers..."
  npx playwright install --with-deps
  echo "[e2e-critical] Run E2E Critical..."
  CI=true npm run test:e2e:critical
fi

echo "=== ci-local-full 완료 ==="
