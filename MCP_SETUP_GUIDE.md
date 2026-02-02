# MCP 서버 설정 가이드

## 1. 파일 시스템 MCP (프로젝트 파일 탐색)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\ghkdd\\gemini-projects\\solve-climb"
      ]
    }
  }
}
```

## 2. Supabase MCP (데이터베이스 작업)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-url",
        "${VITE_SUPABASE_URL}",
        "--api-key",
        "${VITE_SUPABASE_ANON_KEY}"
      ],
      "env": {
        "SUPABASE_URL": "${VITE_SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${VITE_SUPABASE_ANON_KEY}"
      }
    }
  }
}
```

## 3. 브라우저 MCP (웹 테스트)

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    }
  }
}
```

## 4. GitHub MCP (코드 관리)

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

## 설정 방법

### 방법 1: Cursor UI에서 설정
1. `Ctrl + ,` (또는 `File > Preferences > Settings`)
2. 검색창에 "MCP" 입력
3. "MCP Servers" 섹션 찾기
4. "Edit in settings.json" 클릭
5. 위 예시 중 필요한 서버 추가

### 방법 2: 직접 설정 파일 편집
1. `Ctrl + Shift + P` → "Preferences: Open User Settings (JSON)"
2. `mcpServers` 섹션 추가
3. 위 예시 참고하여 서버 구성

## 현재 프로젝트 추천 설정

이 프로젝트(solve-climb)에는 다음이 유용합니다:

1. **파일 시스템 MCP** - 코드 탐색 및 수정
2. **브라우저 MCP** - 프론트엔드 테스트 및 디버깅
3. **Supabase MCP** (선택) - 데이터베이스 직접 작업

## 확인 방법

설정 후 Cursor를 재시작하고, AI와 대화할 때 MCP 도구가 사용 가능한지 확인하세요.

---

## 한 번이라도 설정/확인해야 하는 것 — 체크리스트

아래 항목을 **한 번씩** 확인해 두면 됩니다.

| 항목 | 확인 방법 | 지금 상태(예시) |
|------|-----------|-----------------|
| **Socket** (훅 + MCP) | `node scripts/check-mcp-env.js` 실행 | ❌ → `.env`에 `SOCKET_API_KEY` 추가 후 Cursor MCP Socket env에도 동일 값 |
| **Supabase** (앱) | 위 스크립트에서 `VITE_SUPABASE_*` 확인 | ✅ 스크립트로 확인됨 |
| **Sentry** (앱/MCP) | 위 스크립트에서 `SENTRY_*` 확인 | ✅ 스크립트로 확인됨 |
| **GitHub MCP** | Cursor 설정 → MCP → GitHub 서버에 토큰 설정 여부 | Cursor UI에서만 확인 |
| **Vercel MCP** | Cursor 설정 → MCP → Vercel 서버에 토큰 설정 여부 | Cursor UI에서만 확인 |
| **Linear / Postman MCP** | Cursor 설정 → MCP → 해당 서버 토큰 설정 여부 | Cursor UI에서만 확인 |
| **Playwright MCP** | Composer에서 "Playwright로 아무 URL 열어줘" 요청 → 동작 또는 브라우저 미설치 안내 | 한 번 요청해서 확인 |

**스크립트로 한 번에 확인:**

```bash
node scripts/check-mcp-env.js
```

- ✅ = 해당 환경 변수 설정됨  
- ❌ = 미설정 (쓰려면 `.env` 또는 시스템 환경 변수 추가)  
- MCP 서버별 토큰(GitHub, Vercel 등)은 **Cursor 설정 → Features → MCP** 에서만 확인 가능
