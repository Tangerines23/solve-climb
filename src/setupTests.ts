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

// 테스트 완료 후 MSW 서버 종료 및 리소스 누수 진단
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

  // Active handles diagnostic to find what hangs Vitest
  if (typeof process !== 'undefined' && typeof (process as any)._getActiveHandles === 'function') {
    const handles = (process as any)._getActiveHandles();
    // Filter out standard handles like stdout/stderr/stdin (which have fd: 1/2/0)
    const active = handles.filter((h: any) => {
      if (!h) return false;
      // standard streams
      if (h.fd === 0 || h.fd === 1 || h.fd === 2) return false;
      return true;
    });
    if (active.length > 0) {
      console.log(`[Teardown Diagnostic] Active handles remaining: ${active.length}`);
      active.forEach((h: any, i: number) => {
        console.log(`  Handle ${i}: class=${h?.constructor?.name}, type=${h?.type || 'unknown'}`);
        if (h?._idleTimeout) {
          console.log(`    - Timer timeout: ${h._idleTimeout}ms`);
        }
        if (h?._onTimeout) {
          console.log(`    - Timer handler exists`);
        }
      });
    }
  }
});
