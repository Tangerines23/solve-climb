# security-db Job 실패 시 조치 (SUPABASE_DB_PASSWORD / SASL 28P01)

CI의 **security-db** job에서 아래 에러가 나는 경우:

```
failed SASL auth (FATAL: password authentication failed for user "postgres" (SQLSTATE 28P01))
```

**가능한 원인** (Supabase 공식 트러블슈팅 기준):

1. **비밀번호 불일치**: GitHub Secrets의 `SUPABASE_DB_PASSWORD`가 Supabase DB 비밀번호와 다름.
2. **연결 풀러(Supavisor)**: 풀러가 인증 정보를 잘못 캐시하거나, 반복 실패로 **Runner IP가 일시 차단**된 경우.
3. **CI 측 조치**: 이 저장소 CI는 `supabase link`에 `--skip-pooler`를 사용해 풀러를 우회하고 직접 연결합니다. 그래도 실패하면 아래 수동 조치를 진행하세요.

---

## 1. Supabase 네트워크 차단 확인 (비밀번호가 맞다면 우선 확인)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 해당 프로젝트
2. **Project Settings** → **Database** → **Network / Blocked IPs** (또는 Database Settings)
3. 차단된 IP 목록에 **GitHub Actions Runner IP**가 있으면 제거 후 CI 재실행

---

## 2. 비밀번호/Secret 확인 (수동)

### 1. Supabase에서 DB 비밀번호 확인/재설정

1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 해당 프로젝트 선택
3. **Project Settings** → **Database**
4. **Database password** 섹션에서:
   - **Reset database password**로 새 비밀번호 설정 후 복사해 두기  
   - 또는 이미 알고 있는 비밀번호를 그대로 사용

> ⚠️ 비밀번호를 **재설정**하면 기존에 이 비밀번호를 쓰던 모든 곳(로컬 `.env`, GitHub Secrets 등)을 새 비밀번호로 맞춰야 합니다.

### 2. GitHub Secrets에 반영

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **Repository secrets**에서 `SUPABASE_DB_PASSWORD` 찾기
3. **Update**로 **1단계에서 확인/설정한 DB 비밀번호**로 값 수정

### 3. CI 재실행

- **Actions** 탭 → 실패한 workflow 선택 → **Re-run all jobs**
- 또는 새 커밋을 push해서 워크플로 다시 실행

---

## 참고: security-db job에서 쓰는 Secret

| Secret 이름              | 용도 |
|--------------------------|------|
| `SUPABASE_DB_PASSWORD`   | `supabase link` / DB 연결 시 postgres 비밀번호 |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI 인증 (link 등) |
| `VITE_SUPABASE_URL`      | 프로젝트 URL (project-ref 추출에 사용) |

`SUPABASE_DB_PASSWORD`는 Supabase **Database** 설정에 나오는 **Database password**와 동일한 값이어야 합니다.

---

## 3. MCP / CLI로 사전 확인

### MCP (Supabase MCP 서버)

- **list_projects**: 프로젝트 목록·접근 가능 여부 (Access Token 검증)
- **get_project** (id: project ref): 프로젝트 상세, `status: ACTIVE_HEALTHY` 등
- **execute_sql** (project_id, query): DB에 SQL 실행 (Management API 경로, **DB 비밀번호와 무관**)
- **list_migrations**: 마이그레이션 목록

MCP는 **Access Token** 기반이라 **DB 비밀번호(SUPABASE_DB_PASSWORD)** 검증에는 쓰이지 않습니다. 프로젝트/DB(API 경로)가 살아 있는지 확인할 때 유용합니다.

### 로컬에서 DB 비밀번호 연결 검증 (CI와 동일 방식)

`.env`에 다음을 넣은 뒤:

- `VITE_SUPABASE_URL`
- `SUPABASE_DB_PASSWORD`
- (선택) `SUPABASE_ACCESS_TOKEN`

```bash
npm run check:db:link
```

성공하면 `supabase link --skip-pooler` + `supabase db lint`가 통과한 것이므로, 같은 비밀번호를 GitHub Secrets `SUPABASE_DB_PASSWORD`에 넣으면 CI security-db job도 통과할 가능성이 높습니다.
