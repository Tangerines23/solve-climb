# 🛠️ 개발 도구 및 AI 워크플로우 가이드 (2026)

이 문서는 `solve-climb` 프로젝트에서 사용하는 주요 개발 도구와 AI 기반 개발 생산성을 극대화하기 위한 추천 도구들을 정리합니다.

---

## 🟢 1. 현재 설치 및 사용 중인 도구 (즉시 활용 가능)

이미 프로젝트에 구축되어 있어 바로 실전에 투입할 수 있는 도구들입니다.

### 🤖 AI 전용 도구
*   **Cursor AI & `.cursorrules`**: 단순한 에디터를 넘어 프로젝트의 맥락(TDS 컴포넌트 사용, 파일 구조 등)을 이해하는 지능형 IDE입니다. `.cursorrules`가 AI의 '행동 강령' 역할을 합니다.
*   **GitHub CLI (`gh`)**: 터미널에서 PR 생성, 이슈 관리, CI 상태 확인 등을 수행합니다. AI가 우리를 대신해 GitHub 작업을 할 때 필수적입니다.
*   **MCP (Model Context Protocol)**: 현재 `github`, `supabase` 서버가 연결되어 있어 AI가 직접 레포지토리와 DB를 조작할 수 있습니다.

### 🧪 품질 및 검증 (CI/CD)
*   **Knip (`npm run diet`)**: 사용하지 않는 코드(Dead Code)와 파일을 찾아내어 프로젝트를 가볍게 유지합니다.
*   **Vitest (`npm run test`)**: 빠르고 가벼운 유닛 테스트 도구입니다. 
*   **Playwright (`npm run test:e2e`)**: 실제 브라우저 환경에서 사용자 시나리오 및 비주얼 테스팅을 수행합니다.
*   **Husky & lint-staged**: 커밋하기 전에 자동으로 코드를 검사하여 실수를 방지합니다.

### 📦 핵심 라이브러리 및 플랫폼
*   **Zod**: 이미 프로젝트에 설치되어 있습니다. 런타임에서 데이터의 유효성을 검사하여 AI가 주는 '잘못된 형식의 데이터'를 차단합니다.
*   **Sentry**: 프로덕션 환경에서 발생하는 에러를 실시간으로 트래킹합니다.
*   **Supabase**: 데이터베이스와 인증(Auth)을 담당하는 강력한 백엔드 서비스입니다.
*   **AppInToss & Granite**: 토스 미니앱 연동을 위한 전용 SDK 및 배포 도구입니다.

---

## 🟡 2. 추천 도구 (아직 도입되지 않았거나 옵션인 도구)

더 높은 생산성을 위해 도입을 검토하거나 활용할 수 있는 외부 서비스들입니다.

### 🧠 AI 지능 및 기억력 강화 (MCP)
*   **Sequential Thinking**: 복잡한 로직(퀴즈 알고리즘, 난이도 밸런싱)을 풀 때 AI가 단계별로 추론하도록 강제하여 정확도를 높입니다. (이미 내장됨)
*   **mem0 (AI 장기 기억)**: 세션이 바뀌어도 사용자의 코딩 스타일과 이전 요청을 기억하게 하는 '장기 기억 장치'입니다. (강력 추천)

### 🌐 실시간 지식 및 문서 참조 (할루시네이션 방지)
*   **Google/Brave Search**: AI의 '지식 한계'를 해결합니다. 최신 라이브러리(Vite 7 등)의 공식 문서를 실시간으로 검색합니다.
*   **Fetch**: 특정 기술 문서 URL을 주면 AI가 내용을 파싱하여 정독하게 합니다. 정확한 코드 구현을 위해 필수적입니다.

### 🧪 검증 및 품질 자동화
*   **Playwright Server**: AI가 직접 브라우저를 제어하여 "화면이 깨지는지", "버튼이 눌리는지" 확인하고 리포트를 제출합니다.
*   **Node/Python Sandbox**: 복잡한 알고리즘을 제안하기 전에 격리된 환경에서 미리 실행하여 검증한 뒤 코드를 줍니다.

---

## 🏗️ 3. 아키텍처 및 UI (추천/검토 대상)
*   **tRPC**: 프론트엔드와 백엔드 간의 타입을 100% 동기화하여 '타입 정의 노가다'를 없애줍니다.
*   **v0.dev (by Vercel)**: 채팅만으로 고수준의 React UI(Tailwind 기반)를 즉시 생성합니다. 뼈대를 잡을 때 매우 유용합니다.
*   **shadcn/ui**: AI가 이해하고 수정하기 가장 쉬운 구조로 짜인 컴포넌트 라이브러리입니다.

---

## 🛠️ Cursor MCP 퀵 세팅 (복사/붙여넣기)

커서(Cursor) 에디터의 `Settings > Models > MCP Servers`에서 아래 내용을 복사하여 등록하세요.

| 기능 | 이름 | 타입 | 명령어 및 인자 (Command/Args) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **실시간 검색 (Brave)** | `BraveSearch` | `command` | `npx -y @modelcontextprotocol/server-brave-search` | `BRAVE_API_KEY=BSAB1XSUKnRqmg2qfF09Tu6CAsVClYx` 환경변수로 설정 |
| **AI 장기 기억** | `Memory` | `command` | `npx -y @modelcontextprotocol/server-memory` | - |
| **브라우저 제어** | `Playwright` | `command` | `npx -y @modelcontextprotocol/server-playwright` | - |
| **파일 시스템** | `Files` | `command` | `npx -y @modelcontextprotocol/server-filesystem [사용자폴더경로]` | 전체 파일 읽기 |

---

## 🚀 4. Antigravity (Gemini CLI) 전용 MCP 설정 가이드 (심화)

이 섹션은 **Cursor가 아닌, 현재 실행 중인 AI 에이전트(Antigravity)**에게 툴을 추가하고 싶을 때 참조하세요.
Antigravity는 보안상의 이유로 엄격한 실행 권한을 가집니다. Windows 환경에서는 아래 방법을 권장합니다.

### 📁 설정 파일 위치
`%APPDATA%\Antigravity\User\mcp.json`
(보통 `C:\Users\사용자명\AppData\Roaming\Antigravity\User\mcp.json`)

### 🛠️ Windows 연결 필승 전략
`npx`를 사용하면 타임아웃이 발생할 수 있으므로, **전역 설치 후 직접 실행**하는 것이 가장 안정적입니다.

1.  **전역 설치**: `npm install -g @modelcontextprotocol/server-filesystem @xiaocangpt/mcp-fetch-ya`
2.  **설정 파일 수정 (`mcp.json`)**:
    ```json
    "filesystem": {
      "command": "C:\\Windows\\System32\\cmd.exe",
      "args": [
        "/c",
        "C:\\Users\\YOUR_USER_NAME\\AppData\\Roaming\\npm\\mcp-server-filesystem.cmd",
        "C:\\Path\\To\\Your\\Project"
      ]
    },
    "fetch": {
      "command": "C:\\Windows\\System32\\cmd.exe",
      "args": [
        "/c",
        "C:\\Users\\YOUR_USER_NAME\\AppData\\Roaming\\npm\\mcp-fetch-ya.cmd"
      ]
    }
    ```

---


### ℹ️ Brave Search API 가격 정보
*   **무료 요금제:** **월 2,000회**까지 무료로 검색이 가능합니다.
*   **기간 제한:** 30일 체험판 같은 기간 제한이 아니라, 매달 2,000회의 쿼리가 새로 충전되는 **상시 무료(Forever Free)** 방식입니다.
*   **제한 사항:** 1초에 1번만 요청 가능한 속도 제한이 있지만, 개인 개발용으로는 충분합니다.
*   **키 발급:** [Brave Search API](https://brave.com/search/api/) 사이트에서 이메일 등록 후 즉시 발급 가능합니다.

### ⚠️ 사용량 및 요금 안전 가이드
*   **폭주 방지:** AI는 개발자가 특정 기술 지식이나 검색을 명시적으로 요청할 때만 도구를 사용합니다. 아무 이유 없이 매번 검색하지 않으니 안심하셔도 됩니다.
*   **요금 알림:** Brave 대시보드에서 **Usage Limit(사용량 제한)** 혹은 **Budget(예산)** 설정이 가능한지 확인하고, 가능하다면 $0로 설정하여 무료 범위를 넘지 않게 차단할 수 있습니다.
*   **카드 등록 주의:** 최근 Brave 정책상 가입 시 카드 등록을 요구할 수 있습니다. 무료 범위(2,000회)를 넘기면 유료로 전환될 가능성이 있으니, 대시보드에서 사용량을 가끔 체크해 주시는 것이 좋습니다.
*   **팁:** 검색이 꼭 필요한 질문(예: "최신 v7 문법 검색해 줘")에만 도구를 쓰게 하면 한 달에 2,000회는 충분하고도 남는 양입니다.

---

## 4. 효과적인 AI 개발 전략 (Point)

1.  **"테스트를 통과시켜줘"**: AI에게 코드를 짜달라고 할 때 단순히 결과물만 요구하지 말고, "기존 테스트(`Vitest`)를 통과하고 새로운 `Playwright` 테스트 케이스를 만들어줘"라고 지시하세요.
2.  **프로젝트 SNAP 유지**: `PROJECT_SNAP.md`나 `DEVELOPMENT_TOOLS_GUIDE.md`처럼 문서를 최신으로 유지하면 AI가 프로젝트의 '현재 상태'를 더 정확하게 파악합니다.
3.  **코드 클리닝**: 주기적으로 `npm run diet` (Knip)을 돌려 사용하지 않는 코드를 정리하세요. AI가 읽어야 할 코드가 적을수록 답변 속도와 정확도가 올라갑니다.

---
🚀 5. 고효율 베타 테스트 (로컬 메크로)

베타 테스트 기간 동안 사람 대신 로컬 환경에서 수백 번 이상 테스트를 수행하는 방법입니다.

### 🎥 1) Playwright CodeGen (녹화형 메크로)
사용자의 실제 브라우저 동작을 코드로 즉시 변환합니다. **토큰 소모가 0**입니다.
1.  터미널에서 명령 실행: `npx playwright codegen localhost:5173`
2.  브라우저가 열리면 테스트하고 싶은 시나리오(로그인, 게임 플레이 등)를 수행합니다.
3.  `Playwright Inspector` 창에 자동으로 생성된 코드를 복사하여 `tests/e2e/my-beta-macro.spec.ts`에 저장합니다.
4.  언제든 다시 실행: `npx playwright test tests/e2e/my-beta-macro.spec.ts`

### 🙊 2) 무작위 클릭 테스트 (Monkey Test)
특정 시나리오 없이 알고리즘이 무작위로 버튼을 눌러보며 앱이 터지는지(Crash) 검사합니다.
*   실행: `npx playwright test tests/e2e/monkey-test.spec.ts`
*   용도: 새로운 기능을 배포하기 전, 예기치 못한 예외 상황(예: 광클 시 에러)을 찾는 데 매우 효과적입니다.

---
> [!IMPORTANT]
> **Zod**와 **Vitest**는 AI 협업의 '생명줄'이며, **Playwright**는 베타 테스트의 '강철 자동화' 도구입니다!
