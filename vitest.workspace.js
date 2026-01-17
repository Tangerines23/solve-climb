import { defineWorkspace } from 'vitest/config'
import { mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

/**
 * Vitest Workspace 설정
 * 
 * 테스트를 두 그룹으로 분리하여 실행:
 * 1. unit: 일반 테스트 (빠른 병렬 실행)
 * 2. integration: localStorage 의존 테스트 (격리된 Fork 프로세스)
 * 
 * 실행 방법:
 * - npm test              → 전체 실행
 * - npm run test:unit     → unit만
 * - npm run test:integration  → integration만
 */
export default defineWorkspace([
    // ========================================
    // Unit Tests: 빠른 병렬 실행
    // ========================================
    mergeConfig(baseConfig, {
        test: {
            name: 'unit',
            include: ['src/**/*.test.{ts,tsx}'],
            exclude: [
                // localStorage 전역 Mock 사용 파일 제외
                '**/storage.test.ts',
                '**/debugPresets.test.ts',
                '**/debugPresets.error.test.ts',
                '**/useHistoryData.test.ts',
                // 기본 제외 패턴
                'node_modules/**',
                'dist/**',
                'coverage/**',
            ],
        }
    }),

    // ========================================
    // Integration Tests: 격리된 Fork 실행
    // ========================================
    mergeConfig(baseConfig, {
        test: {
            name: 'integration',
            include: [
                '**/storage.test.ts',
                '**/debugPresets.test.ts',
                '**/debugPresets.error.test.ts',
                '**/useHistoryData.test.ts',
            ],
            // 완전 격리 실행
            pool: 'forks',
            poolOptions: {
                forks: {
                    singleFork: true,  // 각 파일을 별도 프로세스에서 순차 실행
                }
            },
            // 타임아웃 증가 (복잡한 Mock 처리 시간 고려)
            testTimeout: 10000,
        }
    })
])
