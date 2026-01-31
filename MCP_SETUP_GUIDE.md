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
