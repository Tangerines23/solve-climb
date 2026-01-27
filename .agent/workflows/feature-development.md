---
description: solve-climb 프로젝트의 표준 기능 개발 프로세스
---

이 워크플로우는 새로운 기능을 추가하거나 대규모 리팩토링을 수행할 때 AI 에이전트가 따라야 할 표준 절차를 정의합니다.

### 1단계: 요구사항 분석 및 코드 탐색
- 사용자의 요청을 분석하고 관련된 기존 코드(컴포넌트, 훅, 유틸리티, 타입)를 찾아 읽습니다.
- 영향 범위를 파악하고 `task.md`를 초기화합니다.

### 2단계: 기술 설계 및 계획 (PLANNING)
- `implementation_plan.md`를 생성하여 다음 내용을 포함합니다:
    - 구현할 기능 요약
    - 수정/신규 생성할 파일 목록
    - 디자인 시스템(TDS, CSS 변수) 활용 계획
    - 검증 방법 (테스트 코드 등)
- `notify_user`를 사용하여 사용자에게 계획의 승인을 요청합니다.

### 3단계: 기능 구현 (EXECUTION)
- 승인된 계획에 따라 코드를 작성합니다.
- **규칙 준수:** `.agent/rules`에 정의된 코딩 컨벤션과 에이전트 행동 지침을 따릅니다.
- **점진적 커밋 가능:** 각 세부 작업이 완료될 때마다 상태를 보고합니다.

### 4단계: 검증 및 품질 확인 (VERIFICATION)
// turbo
1. 타입 체크를 실행합니다: `npm run type-check`
// turbo
2. 린트 및 스타일을 확인합니다: `npm run lint` 및 `npm run format:check`
// turbo
3. 프로젝트 무결성을 검증합니다: `npm run check:integrity` (CSS 변수, 맞춤법 포함)
// turbo
4. 데드 코드를 감지합니다: `npm run diet` (미사용 파일 및 의존성 체크)
// turbo
5. DB 변경이 있는 경우 검증합니다: `npm run check:db:lint` 및 `npm run check:db:validation`
// turbo
6. 유닛 테스트가 있는 경우 실행합니다: `npm run test`
6. 구현된 기능이 의도대로 동작하는지 확인합니다(필요 시 브라우저 도구 활용).

### 5단계: 완료 및 문서화
- `walkthrough.md`를 작성하여 변경 사항과 검증 결과를 요약합니다.
- `notify_user`를 통해 최종 결과를 보고합니다.
