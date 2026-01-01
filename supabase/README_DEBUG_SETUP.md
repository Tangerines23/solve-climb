# 디버그 모드 DB 설정 가이드

이 가이드는 디버그 모드 기능을 사용하기 위한 데이터베이스 설정 방법을 설명합니다.

## 빠른 시작

### 방법 1: 통합 설정 스크립트 사용 (권장)

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **SQL Editor** 메뉴로 이동
4. `supabase/setup_debug_mode.sql` 파일의 내용을 복사하여 실행

이 스크립트는 다음을 자동으로 수행합니다:
- `game_config` 테이블 생성 (없는 경우)
- `debug_mode_enabled` 설정 추가/업데이트
- `game_sessions.is_debug_session` 컬럼 추가
- 모든 디버그 RPC 함수 생성
- 필요한 권한 부여

### 방법 2: 개별 마이그레이션 파일 사용

개별 마이그레이션 파일을 순서대로 실행:

1. `20250101000000_add_debug_session_flag.sql`
2. `20250101000001_add_debug_mode_config.sql`
3. `20250101000002_update_create_game_session.sql`
4. `20250101000003_update_submit_game_result.sql`
5. `20251229000000_debug_rpc_functions.sql`

### 방법 3: Supabase CLI 사용 (선택 사항)

**참고**: CLI 사용은 추가 설정이 필요합니다. 웹 Dashboard 방법이 더 간단하고 즉시 사용 가능합니다.

CLI를 사용하려면:

```bash
# 1. Supabase CLI 설치 확인
npx supabase --version

# 2. 프로젝트 초기화 (처음만)
npx supabase init

# 3. 원격 프로젝트 링크 (프로젝트 ref 필요)
npx supabase link --project-ref your-project-ref

# 4. 인증 (처음만)
npx supabase login

# 5. 마이그레이션 적용
npx supabase db push
```

**프로젝트 ref 찾는 방법:**
- Supabase Dashboard → 프로젝트 설정 → General → Reference ID

**주의사항:**
- CLI 사용 시 프로젝트 링크와 인증이 필요합니다
- 로컬 Supabase 사용 시 Docker가 필요합니다
- 설정이 복잡할 수 있으므로, 웹 Dashboard 방법을 권장합니다

자세한 내용은 [`docs/SUPABASE_CLI_SETUP.md`](../docs/SUPABASE_CLI_SETUP.md)를 참고하세요.

## 설정 확인

설정이 올바르게 적용되었는지 확인:

1. Supabase Dashboard → **SQL Editor**
2. `supabase/check_debug_setup.sql` 파일의 내용을 복사하여 실행

이 스크립트는 다음을 확인합니다:
- ✅ `game_config` 테이블 존재 여부
- ✅ `debug_mode_enabled` 설정 존재 및 값
- ✅ `game_sessions.is_debug_session` 컬럼 존재 여부
- ✅ 모든 디버그 RPC 함수 존재 여부
- ✅ 함수 권한 부여 여부
- ✅ 인덱스 존재 여부

## 디버그 모드 활성화/비활성화

**중요**: 마이그레이션 적용 후 `debug_mode_enabled`가 `false`로 설정되어 있을 수 있습니다.
개발 환경에서는 `true`로 변경해야 디버그 함수가 작동합니다.

### 개발 환경에서 활성화

**방법 1: SQL 스크립트 사용 (권장)**

1. Supabase Dashboard → SQL Editor
2. `supabase/enable_debug_mode.sql` 파일의 내용을 복사하여 실행

**방법 2: 직접 SQL 실행**

```sql
UPDATE public.game_config 
SET value = 'true',
    updated_at = NOW()
WHERE key = 'debug_mode_enabled';

-- 설정이 없으면 추가
INSERT INTO public.game_config (key, value, description) 
VALUES ('debug_mode_enabled', 'true', 'Enable debug RPC functions (dev only)')
ON CONFLICT (key) DO UPDATE 
SET value = 'true', updated_at = NOW();
```

### 프로덕션 환경에서 비활성화 (중요!)

**방법 1: SQL 스크립트 사용 (권장)**

1. Supabase Dashboard → SQL Editor
2. `supabase/disable_debug_mode.sql` 파일의 내용을 복사하여 실행

**방법 2: 직접 SQL 실행**

```sql
UPDATE public.game_config 
SET value = 'false',
    updated_at = NOW()
WHERE key = 'debug_mode_enabled';
```

⚠️ **경고**: 프로덕션 환경에서는 반드시 `debug_mode_enabled`를 `false`로 설정하세요!
디버그 RPC 함수들은 이 설정이 `true`일 때만 작동합니다.

### 현재 설정 확인

```sql
SELECT 
    key,
    value,
    CASE 
        WHEN value = 'true' THEN '✅ 활성화됨'
        WHEN value = 'false' THEN '❌ 비활성화됨'
        ELSE '❓ 알 수 없음'
    END AS status
FROM public.game_config
WHERE key = 'debug_mode_enabled';
```

## 생성되는 RPC 함수

다음 5개의 디버그 RPC 함수가 생성됩니다:

1. **`debug_set_mastery_score`** - 마스터리 점수 설정
   - 파라미터: `p_user_id UUID`, `p_score BIGINT`
   - 티어 자동 재계산 포함

2. **`debug_set_tier`** - 티어 레벨 설정
   - 파라미터: `p_user_id UUID`, `p_level INTEGER`

3. **`debug_grant_badge`** - 뱃지 부여
   - 파라미터: `p_user_id UUID`, `p_badge_id TEXT`

4. **`debug_remove_badge`** - 뱃지 제거
   - 파라미터: `p_user_id UUID`, `p_badge_id TEXT`

5. **`debug_reset_profile`** - 프로필 초기화
   - 파라미터: `p_user_id UUID`, `p_reset_type TEXT` ('all' | 'score' | 'minerals' | 'tier')

## 보안 사항

모든 디버그 RPC 함수는 다음 보안 체크를 수행합니다:

1. **환경 체크**: `debug_mode_enabled`가 `true`인지 확인
2. **인증 체크**: 사용자가 로그인되어 있는지 확인
3. **권한 체크**: 자신의 데이터만 조작 가능 (다른 사용자 데이터 접근 시도 기록)

## 문제 해결

### "Debug functions are disabled in production" 에러

**원인**: `debug_mode_enabled`가 `false`로 설정되어 있음

**해결**:
```sql
UPDATE public.game_config 
SET value = 'true'
WHERE key = 'debug_mode_enabled';
```

### "Permission denied" 에러

**원인**: 다른 사용자의 데이터를 조작하려고 시도

**해결**: 자신의 `user_id`만 사용하세요. 디버그 패널은 자동으로 현재 로그인한 사용자의 ID를 사용합니다.

### "function does not exist" 에러

**원인**: RPC 함수가 생성되지 않음

**해결**: `setup_debug_mode.sql` 또는 `20251229000000_debug_rpc_functions.sql`을 실행하세요.

### 함수가 작동하지 않는 경우

1. **함수 존재 확인**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'debug_%';
   ```

2. **권한 확인**:
   ```sql
   SELECT has_function_privilege('authenticated', 'debug_set_mastery_score', 'EXECUTE');
   ```

3. **권한 부여** (필요한 경우):
   ```sql
   GRANT EXECUTE ON FUNCTION debug_set_mastery_score(UUID, BIGINT) TO authenticated;
   GRANT EXECUTE ON FUNCTION debug_set_tier(UUID, INTEGER) TO authenticated;
   GRANT EXECUTE ON FUNCTION debug_grant_badge(UUID, TEXT) TO authenticated;
   GRANT EXECUTE ON FUNCTION debug_remove_badge(UUID, TEXT) TO authenticated;
   GRANT EXECUTE ON FUNCTION debug_reset_profile(UUID, TEXT) TO authenticated;
   ```

## 참고 문서

- [런타임 테스트 가이드](../docs/RUNTIME_TEST_GUIDE.md)
- [디버그 모드 구현 계획](../docs/DEBUG_MODE_IMPLEMENTATION_PLAN.md)
- [디버그 모드 최종 분석](../docs/DEBUG_MODE_FINAL_ANALYSIS.md)

## 마이그레이션 파일 목록

다음 마이그레이션 파일들이 순서대로 적용되어야 합니다:

1. `20250101000000_add_debug_session_flag.sql` - 디버그 세션 플래그
2. `20250101000001_add_debug_mode_config.sql` - 디버그 모드 설정
3. `20250101000002_update_create_game_session.sql` - 게임 세션 생성 함수 업데이트
4. `20250101000003_update_submit_game_result.sql` - 게임 결과 제출 함수 업데이트
5. `20251229000000_debug_rpc_functions.sql` - 디버그 RPC 함수들

또는 `setup_debug_mode.sql` 파일 하나로 모든 설정을 적용할 수 있습니다.

