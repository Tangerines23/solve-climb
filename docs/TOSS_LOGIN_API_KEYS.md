# 토스 로그인에 필요한 모든 API 키 및 환경 변수

## 📋 전체 목록

### 1. 클라이언트 측 환경 변수 (.env 파일)

프로젝트 루트의 `.env` 파일에 설정:

| 변수명 | 설명 | 예시 | 필수 여부 |
|--------|------|------|----------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` | ✅ 필수 |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key (공개 키) | `sb_publishable_xxx...` | ✅ 필수 |

**용도**: 클라이언트에서 Supabase Edge Functions 호출 시 사용

---

### 2. Supabase Edge Functions Secrets

Supabase 대시보드 > Settings > Edge Functions > Secrets에서 설정:

| Secret 이름 | 설명 | 형식 | 필수 여부 | 사용 위치 |
|------------|------|------|----------|----------|
| `TOSS_API_BASIC_AUTH` | 토스 OAuth API 인증용 | Base64 인코딩된 `client_id:client_secret` | ✅ 필수 | `toss-oauth`, `migration-link` |
| `SERVICE_ROLE_KEY` | Supabase Service Role Key | JWT 토큰 형식 | ✅ 필수 | `toss-auth`, `migration-status`, `migration-link` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (구버전) | JWT 토큰 형식 | ⚠️ 선택 | `toss-auth` (fallback) |
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` | ⚠️ 선택 | 자동 설정되지만 명시 가능 |
| `TOSS_AUTH_KEY` | 토스 인증 키 | 토스에서 발급한 키 | ⚠️ 선택 | `toss-withdraw` (출금 기능용) |

---

## 🔑 각 키 상세 설명

### 1. TOSS_API_BASIC_AUTH (가장 중요!)

**용도**: 토스 OAuth API에 인증 요청 시 사용

**발급 위치**: 
- [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- 내 앱 > 설정 > OAuth 설정
- `client_id`와 `client_secret` 확인

**형식**:
```javascript
// 브라우저 콘솔에서
const clientId = 'your_client_id';
const clientSecret = 'your_client_secret';
const basicAuth = btoa(`${clientId}:${clientSecret}`);
// 결과: "Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="
```

**설정 방법**:
```bash
supabase secrets set TOSS_API_BASIC_AUTH="Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="
```

**주의사항**:
- "Basic " 접두사 없이 순수 Base64 값만 설정
- 코드에서 자동으로 "Basic "을 추가함

**사용 위치**:
- `supabase/functions/toss-oauth/index.ts` - AccessToken 발급
- `supabase/functions/migration-link/index.ts` - 마이그레이션 링크 생성

---

### 2. SERVICE_ROLE_KEY

**용도**: Supabase Admin API 호출 (사용자 생성/조회 등)

**발급 위치**:
- [Supabase 대시보드](https://app.supabase.com)
- Settings > API
- "service_role" 키 복사 (⚠️ 비밀번호처럼 보관)

**형식**: JWT 토큰 (매우 긴 문자열)

**설정 방법**:
```bash
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**주의사항**:
- 절대 클라이언트 코드에 노출하면 안 됨
- Edge Functions에서만 사용

**사용 위치**:
- `supabase/functions/toss-auth/index.ts` - Supabase 사용자 생성/업데이트
- `supabase/functions/migration-status/index.ts` - 매핑 상태 조회
- `supabase/functions/migration-link/index.ts` - 매핑 저장

---

### 3. VITE_SUPABASE_URL

**용도**: 클라이언트에서 Supabase API 및 Edge Functions 호출

**발급 위치**:
- Supabase 대시보드 > Settings > API
- "Project URL" 복사

**형식**: `https://xxx.supabase.co`

**설정 방법**:
`.env` 파일에 추가:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
```

---

### 4. VITE_SUPABASE_ANON_KEY

**용도**: 클라이언트에서 Supabase API 및 Edge Functions 호출 시 인증

**발급 위치**:
- Supabase 대시보드 > Settings > API
- "anon" "public" 키 복사

**형식**: `sb_publishable_xxx...` 또는 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**설정 방법**:
`.env` 파일에 추가:
```
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx...
```

**주의사항**:
- 공개 키이지만 RLS(Row Level Security)로 보호됨
- 클라이언트 코드에 노출되어도 상대적으로 안전

---

### 5. TOSS_AUTH_KEY (선택사항)

**용도**: 토스 출금 기능 사용 시 (현재 프로젝트에서는 사용 안 함)

**발급 위치**:
- 토스 개발자센터에서 별도 발급

**설정 방법**:
```bash
supabase secrets set TOSS_AUTH_KEY="your_toss_auth_key"
```

---

## 📝 설정 체크리스트

### 클라이언트 측 (.env 파일)

- [ ] `VITE_SUPABASE_URL` 설정됨
- [ ] `VITE_SUPABASE_ANON_KEY` 설정됨

### Supabase Secrets

- [ ] `TOSS_API_BASIC_AUTH` 설정됨 (Base64 형식)
- [ ] `SERVICE_ROLE_KEY` 설정됨
- [ ] (선택) `SUPABASE_SERVICE_ROLE_KEY` 설정됨 (구버전 호환용)
- [ ] (선택) `TOSS_AUTH_KEY` 설정됨 (출금 기능 사용 시)

---

## 🔍 값 확인 방법

### Supabase Secrets 확인

```bash
supabase secrets list
```

### 클라이언트 환경 변수 확인

브라우저 콘솔에서:
```javascript
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

---

## 🚨 문제 해결

### "missing authorization header" 오류

**원인**: `TOSS_API_BASIC_AUTH` 값이 없거나 잘못됨

**해결**:
1. 토스 개발자센터에서 `client_id:client_secret` 확인
2. Base64 인코딩: `btoa('client_id:client_secret')`
3. Supabase Secrets에 재설정
4. Edge Functions 재배포

### "Server configuration error" 오류

**원인**: `SERVICE_ROLE_KEY` 또는 `SUPABASE_URL`이 없음

**해결**:
1. Supabase 대시보드에서 Service Role Key 확인
2. Supabase Secrets에 설정
3. Edge Functions 재배포

---

## 📚 참고 자료

- [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [Supabase Secrets 관리](https://supabase.com/docs/guides/functions/secrets)
- [Supabase API 키 관리](https://supabase.com/docs/guides/api/api-keys)
