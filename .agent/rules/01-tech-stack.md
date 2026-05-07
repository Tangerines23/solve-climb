---
description: 기술 스택 및 라이브러리 사용 가이드
globs: ['src/**/*.ts', 'src/**/*.tsx']
alwaysApply: true
---

# 기술 스택 참조

## 핵심 라이브러리

| 라이브러리    | 버전 | 용도                   |
| ------------- | ---- | ---------------------- |
| React         | 18.3 | UI 프레임워크          |
| Vite          | 7.x  | 빌드 도구              |
| TypeScript    | 5.9  | 타입 시스템            |
| Zustand       | 5.x  | 전역 상태 관리         |
| React Query   | 5.x  | 서버 상태 관리         |
| React Router  | 7.x  | 라우팅                 |
| Supabase      | 2.x  | 백엔드 (DB, Auth, RPC) |
| TailwindCSS   | 4.x  | 스타일링               |
| Framer Motion | 12.x | 애니메이션             |

## 임포트 규칙 (Import Conventions)

### 1. 피처 내부 (Internal)
피처 내부 구성 요소 간의 참조는 반드시 **엄격한 상대 경로**를 사용합니다. 이는 피처의 독립성을 보장하고 순환 참조를 방지합니다.

```typescript
// ✅ 피처 내부에서는 상대 경로 사용
import { quizSchema } from '../types';
import { useQuizLogic } from '../hooks/useQuizLogic';
```

### 2. 피처 외부 (External)
다른 피처나 전역 유틸리티를 참조할 때는 **경로 별칭(@/)**을 사용합니다. 피처 참조 시에는 가급적 해당 피처의 Public API(`index.ts`)를 통해 접근합니다.

```typescript
// ✅ 외부 참조 및 전역 유틸리티는 별칭 사용
import { supabase } from '@/utils/supabaseClient';
import { authService } from '@/features/auth';
```

### 3. 금지 사항
* 피처 내부에서 자신의 피처를 `@/features/현재피처/...`와 같이 절대 경로로 참조하는 것을 금지합니다.
* 깊은 상대 경로(`../../../../`)가 발생할 경우, 해당 로직이 전역 유틸리티로 추출되어야 하는지 검토하십시오.

## 환경 변수 및 타입 안전성

### 1. 환경 변수 접근
`import.meta.env`에 직접 접근하는 것은 **엄격히 금지**됩니다. 반드시 `src/utils/env.ts`에서 검증된 `ENV` 객체를 사용하십시오.

```typescript
// ✅ 올바른 사용 (t3-env 검증 적용)
import { ENV } from '@/utils/env';
const url = ENV.VITE_SUPABASE_URL;

// ❌ 직접 접근 금지
const url = import.meta.env.VITE_SUPABASE_URL;
```

### 2. 타입 안전성 (SSOT)
모든 데이터베이스 및 API 관련 타입은 수동으로 작성하지 않고 `src/types/database.types.ts`에서 추출하여 사용합니다. 이는 백엔드와 프론트엔드의 타입을 일치시키기 위함입니다.

## 컴포넌트 작성 및 상태 관리 규칙

- **함수형 컴포넌트 + Hooks** 사용 (Class 컴포넌트 금지)
- **Hook Bridge 패턴**을 통한 계층 분리 필수 적용
- **Zustand**는 비즈니스 상태 관리에, **React Query**는 서버 데이터 캐싱에 사용
- **TailwindCSS 4.x**와 CSS 변수 기반의 디자인 시스템 준수
