export type Operator = '+' | '-' | '*' | '/';

export interface StageConfig {
    id: number;
    world: number;
    description: string;
    type: 'standard' | 'sequential' | 'fill-blank' | 'parentheses';
    operators: Operator[];
    operandCount: number;
    // Array of ranges for each operand position. 
    // If operandCount > ranges.length, the last range is reused or logic handles it.
    ranges: { min: number; max: number }[];
    constraints?: {
        resultMax?: number;
        resultMin?: number;
        allowNegative?: boolean; // default false
        ensureIntegerDivision?: boolean; // default true for division
        allowRemainder?: boolean; // default false
        forceCarry?: boolean; // for addition
        forceBorrow?: boolean; // for subtraction
        fixedSecondOperand?: number; // e.g. for specific times tables if needed, though ranges usually suffice
    };
}

export const STAGES: StageConfig[] = [
    // World 1: Warm-up (Reflex)
    {
        id: 1,
        world: 1,
        description: '1-digit Addition (Result <= 10)',
        type: 'standard',
        operators: ['+'],
        operandCount: 2,
        ranges: [{ min: 1, max: 9 }, { min: 1, max: 9 }],
        constraints: { resultMax: 10 }
    },
    {
        id: 2,
        world: 1,
        description: '1-digit Subtraction (Result >= 0)',
        type: 'standard',
        operators: ['-'],
        operandCount: 2,
        ranges: [{ min: 1, max: 9 }, { min: 1, max: 9 }],
        constraints: { resultMin: 0 }
    },
    {
        id: 3,
        world: 1,
        description: 'Mixed 1-digit Addition & Subtraction',
        type: 'standard',
        operators: ['+', '-'],
        operandCount: 2,
        ranges: [{ min: 1, max: 9 }, { min: 1, max: 9 }],
        constraints: { resultMax: 18, resultMin: 0 }
    },

    // World 2: Basics (Carry/Borrow)
    {
        id: 4,
        world: 2,
        description: 'Addition with Carry (1-digit + 1-digit = 2-digit)',
        type: 'standard',
        operators: ['+'],
        operandCount: 2,
        ranges: [{ min: 1, max: 9 }, { min: 1, max: 9 }],
        constraints: { resultMin: 10 } // Force result to be 2-digit
    },
    {
        id: 5,
        world: 2,
        description: 'Subtraction with Borrow (2-digit - 1-digit = 1-digit)',
        type: 'standard',
        operators: ['-'],
        operandCount: 2,
        ranges: [{ min: 10, max: 19 }, { min: 1, max: 9 }],
        constraints: { resultMax: 9, resultMin: 0 } // Force result to be 1-digit
    },
    {
        id: 6,
        world: 2,
        description: 'Sequential Calc (2-digit +/- 1-digit)',
        type: 'standard',
        operators: ['+', '-'],
        operandCount: 2,
        ranges: [{ min: 10, max: 99 }, { min: 1, max: 9 }],
        constraints: { resultMin: 0 }
    },

    // World 3: Expansion (Multiplication/Division)
    {
        id: 7,
        world: 3,
        description: 'Basic Multiplication (Times tables 2~5)',
        type: 'standard',
        operators: ['*'],
        operandCount: 2,
        ranges: [{ min: 2, max: 9 }, { min: 2, max: 5 }]
    },
    {
        id: 8,
        world: 3,
        description: 'Advanced Multiplication (Times tables 6~9)',
        type: 'standard',
        operators: ['*'],
        operandCount: 2,
        ranges: [{ min: 2, max: 9 }, { min: 6, max: 9 }]
    },
    {
        id: 9,
        world: 3,
        description: 'Clean Division (No remainders)',
        type: 'standard',
        operators: ['/'],
        operandCount: 2,
        ranges: [{ min: 2, max: 81 }, { min: 2, max: 9 }], // Dividend range is approximate, logic handles exact multiples
        constraints: { ensureIntegerDivision: true }
    },

    // World 4: Skill (Mental Math)
    {
        id: 10,
        world: 4,
        description: 'Double-digit Addition/Subtraction',
        type: 'standard',
        operators: ['+', '-'],
        operandCount: 2,
        ranges: [{ min: 10, max: 99 }, { min: 10, max: 99 }],
        constraints: { resultMin: 0 }
    },
    {
        id: 11,
        world: 4,
        description: 'Three Operands',
        type: 'sequential', // a op b op c
        operators: ['+', '-'],
        operandCount: 3,
        ranges: [{ min: 1, max: 20 }, { min: 1, max: 20 }, { min: 1, max: 20 }],
        constraints: { resultMin: 0 }
    },
    {
        id: 12,
        world: 4,
        description: '2-digit x 1-digit Multiplication',
        type: 'standard',
        operators: ['*'],
        operandCount: 2,
        ranges: [{ min: 10, max: 99 }, { min: 2, max: 9 }]
    },

    // World 5: Master (Mixed Operations)
    {
        id: 13,
        world: 5,
        description: 'Mixed Operators with Precedence',
        type: 'sequential', // Logic needs to handle precedence
        operators: ['+', '-', '*'],
        operandCount: 3,
        ranges: [{ min: 1, max: 10 }, { min: 1, max: 10 }, { min: 1, max: 5 }], // Keep multiplication manageable
        constraints: { resultMin: 0 }
    },
    {
        id: 14,
        world: 5,
        description: 'Fill in the Blank',
        type: 'fill-blank',
        operators: ['+', '-'],
        operandCount: 2,
        ranges: [{ min: 1, max: 20 }, { min: 1, max: 20 }],
        constraints: { resultMin: 0 }
    },
    {
        id: 15,
        world: 5,
        description: 'Complex/Parentheses',
        type: 'parentheses',
        operators: ['+', '-', '*'],
        operandCount: 3,
        ranges: [{ min: 1, max: 10 }, { min: 1, max: 10 }, { min: 2, max: 5 }],
        constraints: { resultMin: 0 }
    }
];

export interface MathProblem {
    expression: string;
    answer: number;
    displayExpression?: string; // For fill-in-the-blank or specific formatting
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomOperator(operators: Operator[]): Operator {
    return operators[Math.floor(Math.random() * operators.length)];
}

function calculate(a: number, b: number, op: Operator): number {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
    }
}

export function generateProblem(stageId: number): MathProblem {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) {
        throw new Error(`Stage ${stageId} not found`);
    }

    let problem: MathProblem = { expression: '', answer: 0 };
    let isValid = false;
    let attempts = 0;

    while (!isValid && attempts < 100) {
        attempts++;
        try {
            if (stage.type === 'standard' || stage.type === 'fill-blank') {
                problem = generateStandardProblem(stage);
            } else if (stage.type === 'sequential') {
                problem = generateSequentialProblem(stage);
            } else if (stage.type === 'parentheses') {
                problem = generateParenthesesProblem(stage);
            }
            isValid = true;
        } catch (e) {
            // Retry if constraints met failure (e.g. negative result when not allowed)
            continue;
        }
    }

    if (!isValid) {
        console.warn(`Failed to generate valid problem for stage ${stageId} after 100 attempts`);
        // Fallback to simple 1+1 to avoid crash
        return { expression: '1 + 1', answer: 2 };
    }

    return problem;
}

function generateStandardProblem(stage: StageConfig): MathProblem {
    const op = getRandomOperator(stage.operators);
    let a: number, b: number;

    if (op === '/') {
        // Special handling for division to ensure integer result
        // Generate divisor (b) and quotient (answer) first
        const divisorRange = stage.ranges[1] || stage.ranges[0];
        const quotientRange = { min: 2, max: 9 }; // Reasonable quotient range for mental math

        b = getRandomInt(divisorRange.min, divisorRange.max);
        const answer = getRandomInt(quotientRange.min, quotientRange.max);
        a = b * answer;

        return {
            expression: `${a} ÷ ${b}`,
            answer: answer
        };
    } else {
        a = getRandomInt(stage.ranges[0].min, stage.ranges[0].max);
        b = getRandomInt(stage.ranges[1]?.min ?? stage.ranges[0].min, stage.ranges[1]?.max ?? stage.ranges[0].max);

        const result = calculate(a, b, op);

        // Check constraints
        if (stage.constraints?.resultMax !== undefined && result > stage.constraints.resultMax) throw new Error('Result too high');
        if (stage.constraints?.resultMin !== undefined && result < stage.constraints.resultMin) throw new Error('Result too low');
        if (!stage.constraints?.allowNegative && result < 0) throw new Error('Negative result');

        let expression = `${a} ${op} ${b}`;
        let displayExpression = expression;

        if (stage.type === 'fill-blank') {
            // Randomly hide a, op, or b? Usually hide operand.
            // Let's hide the second operand for simplicity: "15 - ? = 6"
            // Or hide result? No, result is the answer usually.
            // Requirement: "Return the answer and the masked expression string"
            // If the question is "15 - ? = 6", the answer the user types is 9.
            // So the 'answer' field should be the missing value.

            const hideFirst = Math.random() > 0.5;
            if (hideFirst) {
                // ? + b = result
                displayExpression = `? ${op} ${b} = ${result}`;
                return { expression: displayExpression, answer: a };
            } else {
                // a + ? = result
                displayExpression = `${a} ${op} ? = ${result}`;
                return { expression: displayExpression, answer: b };
            }
        }

        return { expression, answer: result };
    }
}

function generateSequentialProblem(stage: StageConfig): MathProblem {
    // e.g. a + b - c
    // Or 2 + 3 * 4 (Stage 13)

    const ops = [];
    const nums = [];

    for (let i = 0; i < stage.operandCount - 1; i++) {
        ops.push(getRandomOperator(stage.operators));
    }

    for (let i = 0; i < stage.operandCount; i++) {
        const range = stage.ranges[i] || stage.ranges[stage.ranges.length - 1];
        nums.push(getRandomInt(range.min, range.max));
    }

    // Construct expression string
    let expression = `${nums[0]}`;
    for (let i = 0; i < ops.length; i++) {
        expression += ` ${ops[i]} ${nums[i + 1]}`;
    }

    // Calculate result respecting precedence
    // We can use JS eval() but it's safer to implement basic precedence or just use eval for simplicity in this context
    // provided we sanitize inputs (which we generated ourselves).
    // However, for "Mixed Operators with Precedence" (Stage 13), we need standard math rules.
    // For "Sequential Calc" (Stage 6, 11), usually it's left-to-right? 
    // Stage 13 explicitly says "Precedence", implying others might be simple?
    // But standard math always has precedence. Let's stick to standard JS evaluation.

    // Note: 'x' symbol vs '*' symbol. We use '*' for calc, 'x' for display?
    // Let's use standard symbols for calculation.

    // Replace visual operators if needed
    const calcExpression = expression; // JS understands +, -, *, /

    // eslint-disable-next-line no-eval
    const result = eval(calcExpression);

    // Check constraints
    // For Stage 13 (2 + 3 * 4), result is 14.
    // Ensure result is integer (division might break this)
    if (!Number.isInteger(result)) throw new Error('Non-integer result');
    if (stage.constraints?.resultMin !== undefined && result < stage.constraints.resultMin) throw new Error('Result too low');
    if (!stage.constraints?.allowNegative && result < 0) throw new Error('Negative result');

    // Format for display (replace * with x, / with ÷)
    const displayExpression = expression.replace(/\*/g, '×').replace(/\//g, '÷');

    return { expression: displayExpression, answer: result };
}

function generateParenthesesProblem(stage: StageConfig): MathProblem {
    // (a + b) * c
    // Simple template: (a op1 b) op2 c
    const op1 = getRandomOperator(['+', '-']); // Inside parens usually additive
    const op2 = getRandomOperator(['*', '/']); // Outside usually multiplicative for "complex" feel

    const range = stage.ranges[0];
    const a = getRandomInt(range.min, range.max);
    const b = getRandomInt(range.min, range.max);
    const c = getRandomInt(2, 5); // Keep multiplier small

    // Ensure (a op1 b) is positive and valid
    const innerResult = calculate(a, b, op1);
    if (innerResult < 0) throw new Error('Negative inner result');

    let result;
    let expression;

    if (op2 === '/') {
        // Ensure divisibility
        // (inner) / c = result -> inner must be multiple of c
        // Hard to force random a,b to sum to multiple of c.
        // Reverse: generate result, then inner = result * c.
        // Then find a, b such that a op1 b = inner.
        const finalResult = getRandomInt(2, 9);
        const targetInner = finalResult * c;

        // a + b = targetInner OR a - b = targetInner
        if (op1 === '+') {
            // a + b = targetInner
            // split targetInner into two random parts
            const split = getRandomInt(1, targetInner - 1);
            const newA = split;
            const newB = targetInner - split;
            expression = `(${newA} + ${newB}) ÷ ${c}`;
            result = finalResult;
        } else {
            // a - b = targetInner
            const newB = getRandomInt(1, 9);
            const newA = targetInner + newB;
            expression = `(${newA} - ${newB}) ÷ ${c}`;
            result = finalResult;
        }
    } else {
        // Multiplication
        result = calculate(innerResult, c, op2);
        expression = `(${a} ${op1} ${b}) × ${c}`;
    }

    return { expression, answer: result };
}
