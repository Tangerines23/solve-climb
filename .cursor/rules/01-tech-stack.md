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

## 임포트 경로 별칭

```typescript
// ✅ 올바른 사용
import { supabase } from '@/utils/supabaseClient';
import { useQuizStore } from '@/stores/quizStore';

// ❌ 상대 경로 금지
import { supabase } from '../../../utils/supabaseClient';
```

## 환경 변수 접근

```typescript
// ✅ 반드시 ENV 객체 사용 (t3-env 검증 적용)
import { ENV } from '@/utils/env';
const url = ENV.VITE_SUPABASE_URL;

// ❌ 직접 접근 금지
const url = import.meta.env.VITE_SUPABASE_URL;
```

## 상태 관리 패턴

```typescript
// Zustand 스토어 사용
const { score, addScore } = useQuizStore();

// React Query 사용 (서버 데이터)
const { data, isLoading } = useQuery({
  queryKey: ['rankings'],
  queryFn: fetchRankings,
});
```

## 컴포넌트 작성 규칙

- 함수형 컴포넌트 + Hooks 사용
- Props는 인터페이스로 명시적 타입 정의
- `any` 타입 사용 금지 (경고 발생)
