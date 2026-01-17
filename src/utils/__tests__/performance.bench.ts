import { bench, describe } from 'vitest';
import { calculateScoreForTier } from '../tierUtils';
import { generateProblem } from '../MathProblemGenerator';

describe('Performance Benchmarks', () => {
    describe('Quiz Generation', () => {
        bench('산술 문제 100개 생성', () => {
            for (let i = 0; i < 100; i++) {
                generateProblem(Math.floor(Math.random() * 15) + 1);
            }
        });

        bench('다양한 레벨 문제 생성', () => {
            for (let level = 1; level <= 15; level++) {
                for (let i = 0; i < 10; i++) {
                    generateProblem(level);
                }
            }
        });
    });

    describe('Score Calculation', () => {
        bench('티어 점수 계산 1000회', () => {
            for (let i = 0; i < 1000; i++) {
                calculateScoreForTier(5, 10, 1000);
            }
        });

        bench('다양한 티어 점수 계산', () => {
            for (let tier = 1; tier <= 10; tier++) {
                for (let stars = 0; stars <= 10; stars++) {
                    calculateScoreForTier(tier, stars, tier * 1000);
                }
            }
        });
    });
});
