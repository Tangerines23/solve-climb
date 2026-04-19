import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// MSW 2.x requires global fetch, Headers, etc. In some Node/JSDOM environments
// Headers can become undefined during teardown.
if (typeof global.Headers === 'undefined' && typeof window !== 'undefined') {
  global.Headers = window.Headers;
}

// MSW 서버 시작
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// 각 테스트 후 핸들러 초기화 & DOM 정리
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// 테스트 완료 후 MSW 서버 종료
afterAll(() => {
  try {
    if (typeof server !== 'undefined' && server && typeof server.close === 'function') {
      server.close();
    }
  } catch (error) {
    // Silence Headers ReferenceError during teardown in limited environments
    if (!(error instanceof ReferenceError && error.message.includes('Headers'))) {
      throw error;
    }
  }
});
