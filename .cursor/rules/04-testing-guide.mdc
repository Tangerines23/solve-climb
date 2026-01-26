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

## 테스트 작성 원칙
- 사용자 행동 기반 테스트 (구현 세부사항 테스트 금지)
- `getByRole`, `getByLabelText` 우선 사용
- 비동기 작업은 `waitFor`, `findBy*` 사용
