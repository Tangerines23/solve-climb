---
description: 프로젝트 유지보수 및 사전 관리 가이드
globs: ['**/*']
alwaysApply: true
---

# 프로젝트 유지보수 가이드

에이전트는 개발 과정에서 코드 품질 외에도 프로젝트의 관리적 일관성을 유지해야 합니다.

## 1. 맞춤법 사전 (Spell Check) 관리

- 새로운 기술 용어, 외부 라이브러리 명칭, 프로젝트 특정 고유 명사를 도입할 때 반드시 `cspell.json`을 확인합니다.
- `npm run check:spell` 실행 시 발생하는 오탐(False Positive)은 즉시 `cspell.json`의 `words` 배열에 기록하여 사전을 최신으로 유지합니다.
- 오타가 확실한 경우 사전에 추가하지 않고 코드를 수정합니다.

## 2. 작업 추적 (Task Tracking)

- `task.md`는 모든 주요 작업 단계의 전환 시점에 업데이트되어야 합니다.
- `implementation_plan.md`는 대규모 변경 시작 전 사용자의 승인을 받기 위한 필수 도구입니다.
- 작업 완료 후 `walkthrough.md`를 통해 변경 사항과 검증 결과를 투명하게 공유합니다.

## 3. 의존성 및 무결성 확인

- 새로운 파일을 생성하거나 삭제한 경우, `npm run check:integrity`를 실행하여 프로젝트의 전체적인 무결성(네비게이션, 스타일, 맞춤법 등)을 확인합니다.
- CSS 수정 시 반드시 CSS 변수를 사용했는지 `npm run check:css`로 재검증합니다.

## 4. Socket 토큰 돌려쓰기 (훅 + MCP)

- Socket API 토큰은 **한 번만** socket.dev → Settings → API Tokens 에서 발급한다.
- **같은 값**을 두 곳에 넣어 사용한다:
  1. **커밋 훅**: `.env` 또는 시스템 환경변수 `SOCKET_API_KEY` 에 설정 (또는 `SOCKET_CLI_API_TOKEN` / `SOCKET_SECURITY_API_TOKEN`).
  2. **Cursor MCP Socket**: Cursor 설정 → MCP → Socket 서버 → env 에 `SOCKET_API_KEY` 로 같은 토큰 설정.
- 설정 여부 확인: `node scripts/check-mcp-env.js`
