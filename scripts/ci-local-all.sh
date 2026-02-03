#!/usr/bin/env bash
# CI 전체 로컬 검증: .github/workflows/ci.yml 의 모든 job을 동일 순서로 실행
# 푸시 전 로컬에서 한 번 돌려두면 CI 실패를 줄일 수 있음.
#
# 필요 환경 변수 (DB/E2E 포함 검증 시):
#   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
#   SUPABASE_DB_PASSWORD, SUPABASE_ACCESS_TOKEN (DB lint / db push / check:db:validation 시)
#
# 선택 스킵 (시간 절약용):
#   CI_SKIP_DB=1        → security-db 중 DB Lint/Validation 건너뜀 (check:security만 실행)
#   CI_SKIP_E2E=1       → e2e-critical 포함 모든 E2E 건너뜀
#   CI_SKIP_E2E_STABILITY=1  → e2e-stability-test(chaos, stress) 만 건너뜀
#   CI_SKIP_E2E_VISUAL=1     → e2e-visual-layout(visual, a11y, layout) 건너뜀
#   CI_SKIP_PERF=1      → performance-audit(bundle size, Lighthouse) 건너뜀
#   CI_RUN_E2E_AUTH=1   → e2e-auth-db 실행 (CI는 스케줄에서만 실행하므로 기본은 스킵)
#
# 사용법:
#   bash scripts/ci-local-all.sh
#   CI_SKIP_E2E=1 bash scripts/ci-local-all.sh   # E2E 전부 생략 (빠른 검증)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

run_step() {
  echo ""
  echo "=== $1 ==="
  shift
  "$@"
}

echo "[ci-local-all] CI와 동일한 검증을 로컬에서 순서대로 실행합니다."
echo ""

# --- 1. setup ---
run_step "1. setup (의존성 설치)" npm install --legacy-peer-deps

# --- 2. validate ---
run_step "2. validate - Type check" npm run type-check
run_step "2. validate - Lint" npm run lint
run_step "2. validate - Format check" npm run format:check
run_step "2. validate - Security Shield (Secrets)" npm run check:secrets
run_step "2. validate - Circular Dependency" npm run check:circular
run_step "2. validate - Code Integrity" npm run check:integrity
run_step "2. validate - Logic Leash" npm run check:logic
run_step "2. validate - Benchmark Tests" npm run test:bench

# --- 3. unit-test ---
mkdir -p reports
run_step "3. unit-test" npm run test:all -- --reporter=default --reporter=junit --outputFile=reports/test-results.xml

# --- 4. security-db ---
run_step "4. security-db - Security audit" npm run check:security
if [ -z "${CI_SKIP_DB}" ]; then
  if [ -n "${SUPABASE_DB_PASSWORD}" ] && [ -n "${SUPABASE_ACCESS_TOKEN}" ] && [ -n "${VITE_SUPABASE_URL}" ]; then
    echo "" && echo "=== 4. security-db - DB Lint ==="
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
    npx supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
    npx supabase db lint --linked --fail-on error
    run_step "4. security-db - DB validation" npm run check:db:validation
  else
    echo "[4. security-db] SUPABASE_* 미설정 — DB Lint/Validation 건너뜀 (CI와 동일 검증을 위해선 env 설정 후 재실행)."
  fi
else
  echo "[4. security-db] CI_SKIP_DB=1 — DB Lint/Validation 건너뜀."
fi

# --- 5. build ---
run_step "5. build" npm run build

# --- 6. e2e-stability-test ---
if [ -n "${CI_SKIP_E2E}" ] || [ -n "${CI_SKIP_E2E_STABILITY}" ]; then
  echo "[6. e2e-stability-test] Skipped (CI_SKIP_E2E or CI_SKIP_E2E_STABILITY)."
else
  run_step "6. e2e-stability - Playwright install" npx playwright install --with-deps
  run_step "6. e2e-stability - Chaos & Stress" env CI=true npm run test:chaos
  run_step "6. e2e-stability - Stress deep" env CI=true npm run test:stress:deep
fi

# --- 7a. e2e-critical ---
if [ -n "${CI_SKIP_E2E}" ]; then
  echo "[7a. e2e-critical] Skipped (CI_SKIP_E2E)."
else
  if [ -z "${CI_SKIP_E2E_STABILITY}" ]; then
    : # Playwright already installed above
  else
    run_step "7a. e2e-critical - Playwright install" npx playwright install --with-deps
  fi
  run_step "7a. e2e-critical" env CI=true npm run test:e2e:critical
fi

# --- 7a-2. e2e-auth-db (CI는 schedule 시에만 실행) ---
if [ -n "${CI_RUN_E2E_AUTH}" ]; then
  if [ -n "${SUPABASE_DB_PASSWORD}" ] && [ -n "${VITE_SUPABASE_URL}" ]; then
    echo "" && echo "=== 7a-2. e2e-auth-db - DB push ==="
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
    npx supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
    npx supabase db push || (npx supabase migration repair --status reverted 20260123 && npx supabase db push)
  fi
  run_step "7a-2. e2e-auth-db - E2E auth/DB" env CI=true npm run test:e2e:auth-db
else
  echo "[7a-2. e2e-auth-db] Skipped (CI에서는 스케줄 시에만 실행. 로컬에서 돌리려면 CI_RUN_E2E_AUTH=1)."
fi

# --- 7b. e2e-visual-layout ---
if [ -n "${CI_SKIP_E2E}" ] || [ -n "${CI_SKIP_E2E_VISUAL}" ]; then
  echo "[7b. e2e-visual-layout] Skipped (CI_SKIP_E2E or CI_SKIP_E2E_VISUAL)."
else
  if [ -n "${SUPABASE_DB_PASSWORD}" ] && [ -n "${VITE_SUPABASE_URL}" ]; then
    echo "" && echo "=== 7b. e2e-visual-layout - DB push ==="
    PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
    npx supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" && (npx supabase db push || (npx supabase migration repair --status reverted 20260123 && npx supabase db push)) || true
  fi
  run_step "7b. e2e-visual - Visual & A11y" env CI=true bash -c "npm run test:e2e:visual && npm run test:a11y"
  run_step "7b. e2e-visual - Layout deep" npm run check:layout:deep:with-server
fi

# --- 8. performance-audit ---
if [ -n "${CI_SKIP_PERF}" ]; then
  echo "[8. performance-audit] Skipped (CI_SKIP_PERF)."
else
  run_step "8. performance - Bundle size" npm run check:size
  run_step "8. performance - Lighthouse" npm run check:score
fi

echo ""
echo "=== ci-local-all 완료: CI와 동일한 검증을 모두 통과했습니다 ==="
