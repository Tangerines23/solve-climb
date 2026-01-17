import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateSequenceProblem, generateLogicProblem } from '../LogicProblemGenerator';

describe('LogicProblemGenerator', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('generateSequenceProblem', () => {
        it('should return a valid problem structure', () => {
            const problem = generateSequenceProblem('easy');
            expect(problem).toHaveProperty('question');
            expect(problem).toHaveProperty('answer');
            expect(typeof problem.question).toBe('string');
            expect(typeof problem.answer).toBe('number');
        });

        it('should generate arithmetic or geometric sequences for easy difficulty', () => {
            // Mock random to select arithmetic (index 0) or geometric (index 1)
            // Since type selection uses Math.floor(Math.random() * types.length)
            // types for easy are ['arithmetic', 'geometric']

            const prob = generateSequenceProblem('easy');
            expect(prob.question).toContain('[ ? ]');
        });

        it('should generate arithmetic sequence correctly', () => {
            // Mocking randomness to force 'arithmetic' type
            // And control start/diff values

            // We need to spy on Math.random. 
            // The function calls random multiple times:
            // 1. Select type index
            // 2. Select variables inside switch case

            const randomSpy = vi.spyOn(Math, 'random');

            // Control flow:
            // 1. type index: 0 (arithmetic) -> returns 0 when multiplied by 2
            // 2. start: Need 1-20. Let's aim for 5. (0.2 * 20 + 1 = 5) -> 0.2
            // 3. diff: Need 1-10. Let's aim for 3. (0.2 * 10 + 1 = 3) -> 0.2

            randomSpy.mockReturnValueOnce(0.1) // index 0 (arithmetic)
                .mockReturnValueOnce(0.2) // start = 5
                .mockReturnValueOnce(0.2); // diff = 3

            // Sequence: 5, 8, 11, 14, [17]
            // Question: 5, 8, 11, 14, [ ? ]
            // Answer: 17

            const problem = generateSequenceProblem('easy');
            // Note: Implementation pops the last element for the answer
            // So sequence in question is 5, 8, 11, 14

            expect(problem.answer).toBe(17);
            expect(problem.question).toBe('5, 8, 11, 14, [ ? ]');
        });

        it('should generate geometric sequence correctly', () => {
            // types: ['arithmetic', 'geometric'] (length 2)
            // index 1 for geometric (0.6 * 2 = 1.2 -> 1)

            const randomSpy = vi.spyOn(Math, 'random');
            randomSpy.mockReturnValueOnce(0.6) // index 1 (geometric)
                .mockReturnValueOnce(0.2) // start = 2 (1-5 range: 0.2 * 5 + 1 = 2)
                .mockReturnValueOnce(0.2); // ratio = 2 (2-4 range: 0.2 * 3 + 2 = 2.6 -> 2)

            // Sequence: 2, 4, 8, 16, [32]
            const problem = generateSequenceProblem('easy');

            expect(problem.answer).toBe(32);
            expect(problem.question).toBe('2, 4, 8, 16, [ ? ]');
        });

        it('should generate fibonacci sequence correctly', () => {
            // Difficulty: medium. types: ['arithmetic', 'geometric', 'fibonacci'] (length 3)
            // index 2 for fibonacci (0.8 * 3 = 2.4 -> 2)

            const randomSpy = vi.spyOn(Math, 'random');
            randomSpy.mockReturnValueOnce(0.8) // index 2 (fibonacci) - for medium
                .mockReturnValueOnce(0.1) // start1 = 1 (1-3 range)
                .mockReturnValueOnce(0.1); // start2 = 1 (1-5 range)

            // Sequence logic: [1, 1] -> 2 -> 3 -> 5 -> 8
            // Loop runs i=2 to 5 (4 times)
            // seq[2] = 1+1=2
            // seq[3] = 1+2=3
            // seq[4] = 2+3=5
            // seq[5] = 3+5=8
            // Final sequence array: [1, 1, 2, 3, 5, 8]
            // Answer is last element: 8
            // Pre-pop content: [1, 1, 2, 3, 5]

            const problem = generateSequenceProblem('medium');
            expect(problem.answer).toBe(8);
            expect(problem.question).toBe('1, 1, 2, 3, 5, [ ? ]');
        });

        it('should generate incrementing_diff sequence correctly', () => {
            // Difficulty: hard. types: ['fibonacci', 'incrementing_diff', 'alternating'] (length 3)
            // index 1 for incrementing_diff

            const randomSpy = vi.spyOn(Math, 'random');
            randomSpy.mockReturnValueOnce(0.5) // index 1
                .mockReturnValueOnce(0.1); // current (start) = 2 (1-10 range: 0.1*10+1 = 2)

            // Logic:
            // start: 2
            // diff starts at 1
            // i=0: current+=1 (3), diff=2 -> push 3
            // i=1: current+=2 (5), diff=3 -> push 5
            // i=2: current+=3 (8), diff=4 -> push 8
            // i=3: current+=4 (12), diff=5 -> push 12
            // Sequence: 2, 3, 5, 8, 12
            // Answer: 12
            // Question: 2, 3, 5, 8

            const problem = generateSequenceProblem('hard');
            expect(problem.answer).toBe(12);
            expect(problem.question).toBe('2, 3, 5, 8, [ ? ]');
        });

        it('should generate alternating sequence correctly', () => {
            // Difficulty: hard. types: ['fibonacci', 'incrementing_diff', 'alternating'] (length 3)
            // index 2 for alternating

            const randomSpy = vi.spyOn(Math, 'random');
            randomSpy.mockReturnValueOnce(0.9) // index 2
                .mockReturnValueOnce(0.1) // start = 12 (10-30: 0.1*21+10 = 12.1 -> 12)
                .mockReturnValueOnce(0.1) // diff1 = 2 (2-5: 0.1*4+2 = 2.4 -> 2)
                .mockReturnValueOnce(0.1); // diff2 = 1 (1-3: 0.1*3+1 = 1.3 -> 1)

            // Logic:
            // start: 12
            // i=0 (even): +diff1(+2) -> 14
            // i=1 (odd): -diff2(-1) -> 13
            // i=2 (even): +diff1(+2) -> 15
            // i=3 (odd): -diff2(-1) -> 14
            // Sequence: 12, 14, 13, 15, 14
            // Answer: 14
            // Question: 12, 14, 13, 15

            const problem = generateSequenceProblem('hard');
            expect(problem.answer).toBe(14);
            expect(problem.question).toBe('12, 14, 13, 15, [ ? ]');
        });
    });

    describe('generateLogicProblem', () => {
        it('should delegate to generateSequenceProblem', () => {
            // Just verify it returns same structure
            const problem = generateLogicProblem('logic', 'easy');
            expect(problem).toHaveProperty('question');
            expect(problem).toHaveProperty('answer');
        });
    });
});
