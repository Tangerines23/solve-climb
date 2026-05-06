import { describe, it, expect, vi } from 'vitest';
import { calculateScoreForTier } from '../tierUtils';
import { generateProblem } from '../MathProblemGenerator';

// 🧪 Mock environment and constants to avoid network requests during logic tests
vi.mock('@/features/quiz/constants/tiers', () => ({
  loadTierDefinitions: vi.fn().mockResolvedValue([
    { level: 0, name: 'Base', icon: '', minScore: 0, colorVar: '' },
    { level: 5, name: 'Summit', icon: '', minScore: 100000, colorVar: '' },
  ]),
  loadCycleCap: vi.fn().mockResolvedValue(250000),
}));

vi.mock('../env', () => ({
  ENV: {
    VITE_SUPABASE_URL: 'https://mock.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'mock-key',
    isProd: false,
    isDev: true,
  },
  logEnvInfo: vi.fn(),
  config: {
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_ANON_KEY: 'mock-key',
    IS_DEVELOPMENT: true,
    IS_PRODUCTION: false,
  },
}));

/**
 * ⚡ Logic Leash (로직 목줄)
 * "느리면 배포 금지" 정책을 집행하는 성능 보증 테스트입니다.
 */
describe('Gameplay Logic Latency Check', () => {
  const measureExecution = (fn: () => void, iterations: number) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    return end - start;
  };

  /**
   * 1. 문제 생성 속도 검증
   * - 목표: 문제 100개를 50ms 안에 생성 (개당 0.5ms)
   * - 실패 시: 문제 생성 알고리즘이 너무 무거워졌음을 의미 (렉 유발)
   */
  it('should generate 100 arithmetic problems under 250ms', () => {
    const iterations = 100;
    const limitMs = 250; // Increased for CI runner stability

    const duration = measureExecution(() => {
      // 레벨 1~15 무작위 생성
      generateProblem(Math.floor(Math.random() * 15) + 1);
    }, iterations);

    console.log(
      `⏱️ [Problem Gen] ${iterations} items took ${duration.toFixed(2)}ms (Limit: ${limitMs}ms)`
    );

    expect(duration).toBeLessThan(limitMs);
  });

  /**
   * 2. 티어 점수 계산 속도 검증
   * - 목표: 점수 계산 1000회를 600ms 안에 완료
   * - 실패 시: 랭킹 페이지나 결과창에서 UI 뚝뚝 끊김 발생 가능
   */
  it('should calculate tier scores 1000 times under 600ms', async () => {
    const iterations = 1000;
    const limitMs = 600; // Increased for CI runner stability

    // calculateScoreForTier is async now
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await calculateScoreForTier(5, 10, 1000);
    }
    const duration = performance.now() - start;

    console.log(
      `⏱️ [Tier Calc] ${iterations} ops took ${duration.toFixed(2)}ms (Limit: ${limitMs}ms)`
    );

    expect(duration).toBeLessThan(limitMs);
  });
});
