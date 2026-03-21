---
description: 코드 품질 및 린팅 규칙
globs: ['src/**/*.ts', 'src/**/*.tsx']
alwaysApply: true
---

# 코드 품질 규칙

## ESLint 핵심 규칙

- `@typescript-eslint/no-explicit-any`: **warn** (새 코드는 error)
- `no-unused-vars`: TypeScript 규칙 사용 (`^_` 패턴 허용)

## 로깅 규칙

```typescript
// ❌ console.log 금지
console.log('debug:', data);

// ✅ logger 유틸리티 사용
import { logger } from '@/utils/logger';
logger.info('Component', '데이터 로드 완료', { data });
logger.error('API', '요청 실패', error);
```

## TypeScript 규칙

- `strict: true` 활성화
- `noUnusedLocals`, `noUnusedParameters` 활성화
- 인터페이스로 Props 타입 명시

```typescript
// ✅ 명시적 타입 정의
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // ...
}
```

## Prettier 설정

- `printWidth`: 100
- `singleQuote`: true
- `tabWidth`: 2
- `trailingComma`: 'es5'

## 네이밍 컨벤션

| 대상       | 패턴                   | 예시                   |
| ---------- | ---------------------- | ---------------------- |
| 컴포넌트   | PascalCase             | `QuizCard.tsx`         |
| 훅         | camelCase + use 접두사 | `useQuizStore.ts`      |
| 유틸리티   | camelCase              | `formatNumber.ts`      |
| 상수       | UPPER_SNAKE_CASE       | `MAX_LEVEL = 15`       |
| CSS 클래스 | kebab-case             | `.quiz-card-container` |

### DB 품질 관리 (DB Quality)

- **SQL 마이그레이션**: 모든 SQL 변경 사항은 `supabase/migrations/`에 저장되어야 하며, `check:db:lint`를 통과해야 합니다.
- **함수 오버로드 금지**: 동일한 이름의 RPC 함수 오버로드는 `check:db:lint`에서 오류를 발생시키므로 피해야 합니다.

### 기술적 부채 및 무결성 (Technical Debt & Integrity)

- **매직 스트링 (Magic Strings)**: 동일한 문자열이 5회 이상 반복될 경우 반드시 `src/constants/`로 추출해야 합니다. (`npm run check:integrity`에서 강제됨)
- **데드 코드 (Dead Code)**: 사용하지 않는 파일, 내보내기(exports), 의존성은 즉시 제거해야 합니다. (`npm run diet` 기반)
- **UI 레이아웃 (UI Overflow)**: 모든 주요 화면은 `VisualGuardian`의 감시를 받으며, E2E 테스트 단계에서 `expectNoOverflow` 검증을 통과해야 합니다.
- 복잡한 SQL 로직은 반드시 `test_db_all_validations` RPC를 통해 무결성을 검증합니다.

## 입출력 및 데이터베이스 규칙

- SQL 마이그레이션 작성 시, 변경될 테이블을 참조하는 모든 RPC 함수 및 View를 전수 조사합니다.
- `DROP FUNCTION IF EXISTS`를 사용하여 기존 오버로드 함수를 명확히 정리합니다.

## 금지 패턴

- `== / !=` 대신 `=== / !==` 사용
- 매직 넘버 사용 금지 (상수로 정의)
- 중첩 삼항 연산자 금지

## Deprecated 패턴 (사용 금지)

- ❌ **Class 컴포넌트** → 함수형 컴포넌트 사용
- ❌ **Redux** → Zustand 사용
- ❌ **axios** → fetch 또는 Supabase 클라이언트 사용
- ❌ **moment.js** → 네이티브 Date 또는 date-fns 사용
- ❌ **CSS-in-JS (styled-components)** → TailwindCSS + CSS 변수 사용
