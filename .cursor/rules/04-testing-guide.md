---
description: 테스트 작성 가이드 (Vitest, Playwright)
globs: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"]
alwaysApply: false
---

# 테스트 작성 가이드

## 테스트 프레임워크
- **단위 테스트**: Vitest + React Testing Library
- **E2E 테스트**: Playwright
- **컴포넌트 테스트**: Playwright CT

## 테스트 파일 위치
```
src/
├── components/
│   └── __tests__/           # 컴포넌트 테스트
│       └── Button.test.tsx
├── utils/
│   └── __tests__/           # 유틸리티 테스트
│       └── formatNumber.test.ts
tests/
├── e2e/                     # E2E 테스트
│   └── quiz-flow.spec.ts
└── integration/             # 통합 테스트
    └── rpc-validation.test.ts
```

## 단위 테스트 패턴
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('클릭 시 onClick 호출', async () => {
    const handleClick = vi.fn();
    render(<Button label="테스트" onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## MSW Mock 사용
```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

beforeEach(() => {
  server.use(
    http.get('/api/rankings', () => {
      return HttpResponse.json({ data: mockRankings });
    })
  );
});
```

## 테스트 실행 명령어
| 명령어 | 용도 |
|--------|------|
| `npm run test` | Watch 모드 |
| `npm run test:all` | 전체 테스트 1회 실행 |
| `npm run test:unit` | 단위 테스트만 |
| `npm run test:coverage` | 커버리지 리포트 생성 |
| `npm run test:e2e` | Playwright E2E |
| `npm run check:layout:deep` | 레이아웃 오버플로우 심층 검사 |
| `npx playwright test tests/e2e/visual.spec.ts` | 시각적 회귀 테스트 |
| `npx playwright test --update-snapshots` | 시각적 스냅샷 업데이트 |

## 테스트 신뢰도 검증 (Mutation Testing)
로직 테스트가 실제로 버그를 잡는지 확인하려면, **일부러 코드를 고장 내보는 Mutation Testing**을 수행합니다:
1. 핵심 함수(예: `getNextLevel`)를 잘못된 값을 반환하도록 수정합니다.
2. 해당 테스트 파일을 실행합니다: `npm test [파일경로]`
3. 테스트가 **반드시 실패해야** 합니다. 실패하지 않으면 테스트 강화가 필요합니다.
4. 원래 코드로 복구합니다.

## 테스트 작성 원칙
- 사용자 행동 기반 테스트 (구현 세부사항 테스트 금지)
- `getByRole`, `getByLabelText` 우선 사용
- 비동기 작업은 `waitFor`, `findBy*` 사용

