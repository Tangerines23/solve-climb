import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// MSW 서버 시작
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// 각 테스트 후 핸들러 초기화 & DOM 정리
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// 테스트 완료 후 MSW 서버 종료
afterAll(() => server.close());
