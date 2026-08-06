import { test } from 'vitest';
import { generateQuestion } from '@/utils/quizGenerator';
import { WORLD_TIPS } from '@/constants/tips';
import * as fs from 'fs';

// 소수 판정 함수
const isPrime = (num: number): boolean => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

// 캐리(받아올림/내림) 감지 함수
const countCarries = (op: string, n1: number, n2: number): number => {
  let carries = 0;
  const str1 = n1.toString().split('').reverse().join('');
  const str2 = n2.toString().split('').reverse().join('');
  const len = Math.max(str1.length, str2.length);

  if (op === '+' || op === '덧셈') {
    let carry = 0;
    for (let i = 0; i < len; i++) {
      const d1 = Number(str1[i] || 0);
      const d2 = Number(str2[i] || 0);
      const sum = d1 + d2 + carry;
      if (sum >= 10) {
        carry = 1;
        carries++;
      } else {
        carry = 0;
      }
    }
  } else if (op === '-' || op === '뺄셈') {
    let borrow = 0;
    for (let i = 0; i < len; i++) {
      const d1 = Number(str1[i] || 0) - borrow;
      const d2 = Number(str2[i] || 0);
      if (d1 < d2) {
        borrow = 1;
        carries++;
      } else {
        borrow = 0;
      }
    }
  }
  return carries;
};

// 암산 난이도 점수 계산 (Cognitive Load Score - Operator-Weighted Version)
const calculateDifficultyScore = (
  worldId: string,
  level: number,
  question: string,
  _answer: any
): number => {
  const qStr = question.toString();

  // 1. WM 점수 (보정형 공식 적용)
  const numbers = (qStr.match(/\d+/g) || []).map(Number);
  const operandCount = numbers.length || 2;
  const totalDigits = numbers.reduce((acc, num) => acc + num.toString().length, 0) || 2;

  // wmScore: 자릿수 증가 부하(1.5배) + 피연산자 개수 증가 부하(0.8배)
  const wmScore = (totalDigits - operandCount) * 1.5 + (operandCount - 1) * 0.8;

  // 2. Carry 점수
  let carryScore = 0;
  const operators = qStr.match(/[+\-*/×÷]/g) || [];
  if (numbers.length >= 2) {
    for (let i = 0; i < Math.min(operators.length, numbers.length - 1); i++) {
      const op = operators[i];
      const n1 = numbers[i];
      const n2 = numbers[i + 1];
      if (op === '+' || op === '-') {
        const carries = countCarries(op, n1, n2);
        carryScore += carries * (op === '+' ? 1.0 : 1.5);
      }
    }
  }

  // 3. Prime 점수 (수 유형 친숙도 - 10 초과의 소수에 대해서만 난이도 부여)
  let primeScore = 0;
  for (const num of numbers) {
    if (num > 0 && (num % 5 === 0 || num % 10 === 0)) {
      primeScore -= 0.8; // 배수 보너스 감점
    } else if (num > 10 && isPrime(num)) {
      primeScore += 1.2; // 10 초과의 소수만 부하 부여 (한자리 소수는 제외)
    }
  }

  // 4. PEMDAS 점수 (혼합 연산 및 우선순위)
  let pemdasScore = 0;
  const normalizedOps = operators.map((op) => (op === '×' ? '*' : op === '÷' ? '/' : op));
  const uniqueOps = new Set(normalizedOps);

  if (uniqueOps.size > 1) {
    pemdasScore += 2.0;
  }
  const opStr = normalizedOps.join('');
  if (/[+-].*[*/]/.test(opStr)) {
    pemdasScore += 1.5;
  }

  // 5. 연산자 기본 인지 가중치 (Operator Baseline Weight)
  let opWeight = 0;
  for (const op of operators) {
    if (op === '-') {
      opWeight += 0.5; // 뺄셈 인지 부하 추가
    } else if (op === '×' || op === '*' || op === 'x') {
      opWeight += 1.0; // 곱셈 인지 부하 추가
    } else if (op === '÷' || op === '/') {
      opWeight += 1.5; // 나눗셈 인지 부하 추가
    }
  }

  // 6. 비수식 / 개념적 인지 가중치 (World 2~4 용 - 완만하게 보정)
  let conceptWeight = 0;
  if (worldId !== 'World1') {
    conceptWeight = level * 0.5; // 개념 지수를 0.5로 완화
  }

  const score = wmScore + carryScore + primeScore + pemdasScore + opWeight + conceptWeight;
  return Number(Math.max(1, score).toFixed(2));
};

test('Audit Basic category tips and problems with difficulty scores', () => {
  const worlds = ['World1', 'World2', 'World3', 'World4'] as const;
  const maxLevels: Record<string, number> = {
    World1: 30,
    World2: 15,
    World3: 15,
    World4: 15,
  };

  const reportData: any[] = [];

  // 각 월드/레벨별 매칭 검사 룰 정의
  const checkRule = (worldId: string, level: number, question: string, answer: any): boolean => {
    const qStr = question.toString();
    const aStr = answer.toString();

    if (worldId === 'World1') {
      if (level === 1) return qStr.includes('+');
      if (level === 2) return qStr.includes('-');
      if (level === 3) return qStr.includes('+');
      if (level === 4) return qStr.includes('-');
      if (level === 5) return (qStr.match(/[+-]/g) || []).length >= 2;
      if (level === 6) return qStr.includes('×') || qStr.includes('*') || qStr.includes('x');
      if (level === 7) return qStr.includes('÷') || qStr.includes('/');
      if (level === 8)
        return qStr.includes('×') || qStr.includes('÷') || qStr.includes('*') || qStr.includes('/');
      if (level === 9)
        return (
          qStr.includes('+') ||
          qStr.includes('×') ||
          qStr.includes('*') ||
          qStr.includes('0') ||
          qStr.includes('1')
        );
      return (
        qStr.includes('+') ||
        qStr.includes('-') ||
        qStr.includes('×') ||
        qStr.includes('÷') ||
        qStr.includes('*') ||
        qStr.includes('/')
      );
    }

    if (worldId === 'World2') {
      if (level === 1)
        return qStr.includes('꼭짓점') || qStr.includes('변') || qStr.includes('각형');
      if (level === 2) return qStr.includes('대칭축') || qStr.includes('대칭');
      if (level === 3)
        return qStr.includes('삼각형') || qStr.includes('각') || qStr.includes('내각');
      if (level === 4)
        return qStr.includes('사각형') || qStr.includes('평행사변형') || qStr.includes('각');
      if (level === 5) return qStr.includes('직사각형') && qStr.includes('넓이');
      if (level === 6) return qStr.includes('삼각형') && qStr.includes('넓이');
      if (level === 7) return qStr.includes('사다리꼴') && qStr.includes('넓이');
      if (level === 8)
        return qStr.includes('반지름') || qStr.includes('지름') || qStr.includes('원');
      if (level === 9) return qStr.includes('원') && qStr.includes('둘레');
      if (level === 10) return qStr.includes('원') && qStr.includes('넓이');
      if (level === 11) return qStr.includes('대각선');
      if (level === 12)
        return (
          qStr.includes('기둥') ||
          qStr.includes('뿔') ||
          qStr.includes('모서리') ||
          qStr.includes('꼭짓점') ||
          qStr.includes('면')
        );
      if (level === 13) return qStr.includes('부피') || qStr.includes('직육면체');
      if (level === 14)
        return (
          qStr.includes('빗변') ||
          qStr.includes('직각삼각형') ||
          qStr.includes('길이') ||
          qStr.includes('피타고라스')
        );
      if (level === 15) return qStr.includes('sin') || qStr.includes('cos') || qStr.includes('tan') || qStr.includes('값');
    }

    if (worldId === 'World3') {
      if (level === 1 || level === 2) return qStr.includes('평균');
      if (level === 3) return qStr.includes('중앙값');
      if (level === 4) return qStr.includes('최빈값');
      if (level === 5) return qStr.includes('동전');
      if (level === 6) return qStr.includes('가위바위보');
      if (level === 7) return qStr.includes('주사위');
      if (level === 8) return qStr.includes('대표') || qStr.includes('경우의 수');
      if (level === 9)
        return qStr.includes('한 줄로') || qStr.includes('나열') || qStr.includes('경우의 수');
      if (level === 10 || level === 11 || level === 12 || level === 15)
        return qStr.includes('확률') || qStr.includes('%');
      if (level === 13) return qStr.includes('범위');
      if (level === 14) return qStr.includes('경우의 수') || qStr.includes('꺼내');
    }

    if (worldId === 'World4') {
      if (level === 1) return qStr.includes('2진수') || qStr.includes('10진수');
      if (level === 2) return qStr.includes('10진수') || qStr.includes('2진수');
      if (level === 3) return qStr.includes('16진수') || qStr.includes('10진수');
      if (level === 4) return qStr.includes('AND');
      if (level === 5) return qStr.includes('OR');
      if (level === 6) return qStr.includes('NOT');
      if (level === 7) return qStr.includes('XOR');
      if (level === 8) return qStr.includes('스택') || qStr.includes('Stack');
      if (level === 9) return qStr.includes('큐') || qStr.includes('Queue');
      if (level === 10 || level === 11)
        return (
          qStr.includes('바이트') ||
          qStr.includes('비트') ||
          qStr.includes('KB') ||
          qStr.includes('MB') ||
          qStr.includes('GB') ||
          qStr.includes('TB') ||
          qStr.includes('배')
        );
      if (level === 12) return qStr.includes('1의 보수') || qStr.includes('보수');
      if (level === 13) return qStr.includes('2의 보수') || qStr.includes('보수');
      if (level === 14)
        return (
          qStr.includes('2진수') &&
          (qStr.includes('합') || qStr.includes('+') || qStr.includes('더한'))
        );
      if (level === 15)
        return (
          qStr.includes('소수') ||
          qStr.includes('실수') ||
          qStr.includes('부동소수점') ||
          qStr.includes('.') ||
          /^[01.]+$/.test(aStr)
        );
    }

    return true;
  };

  for (const worldId of worlds) {
    const levelsCount = maxLevels[worldId];
    for (let level = 1; level <= levelsCount; level++) {
      const questions: any[] = [];
      let successCount = 0;
      const answers: any[] = [];
      const difficulties: number[] = [];

      for (let i = 0; i < 100; i++) {
        const q = generateQuestion('math', worldId, `${worldId}-기초`, level, 'medium');
        questions.push(q);
        answers.push(q.answer);

        const diff = calculateDifficultyScore(worldId, level, q.question, q.answer);
        difficulties.push(diff);

        if (checkRule(worldId, level, q.question, q.answer)) {
          successCount++;
        }
      }

      // 정답 수치 분석
      let totalValue = 0;
      let numericCount = 0;
      let minVal = Infinity;
      let maxVal = -Infinity;

      let integerCount = 0;
      let decimalCount = 0;
      let fractionCount = 0;
      let otherTypeCount = 0;

      for (const ans of answers) {
        const ansStr = ans.toString();

        if (ansStr.includes('/')) {
          fractionCount++;
        } else if (!isNaN(Number(ansStr)) && ansStr.trim() !== '') {
          const num = Number(ansStr);
          if (Number.isInteger(num)) {
            integerCount++;
          } else {
            decimalCount++;
          }

          totalValue += num;
          numericCount++;
          if (num < minVal) minVal = num;
          if (num > maxVal) maxVal = num;
        } else {
          otherTypeCount++;
        }
      }

      const avgVal = numericCount > 0 ? totalValue / numericCount : null;
      const matchRate = (successCount / 100) * 100;

      // 난이도 통계
      const totalDiff = difficulties.reduce((acc, d) => acc + d, 0);
      const avgDiff = Number((totalDiff / 100).toFixed(2));
      const minDiff = Math.min(...difficulties);
      const maxDiff = Math.max(...difficulties);

      const tipItem = WORLD_TIPS[worldId]?.[level];

      reportData.push({
        worldId,
        level,
        tipTitle: tipItem ? tipItem.title : 'N/A',
        tipContent: tipItem ? tipItem.tip : 'N/A',
        matchRate,
        avgDiff,
        minDiff,
        maxDiff,
        stats: {
          total: 100,
          integerRate: (integerCount / 100) * 100,
          decimalRate: (decimalCount / 100) * 100,
          fractionRate: (fractionCount / 100) * 100,
          otherTypeRate: (otherTypeCount / 100) * 100,
          avg: avgVal !== null ? Number(avgVal.toFixed(2)) : 'N/A',
          min: minVal !== Infinity ? minVal : 'N/A',
          max: maxVal !== -Infinity ? maxVal : 'N/A',
        },
        sampleQuestions: questions.slice(0, 3).map((q) => ({ q: q.question, a: q.answer })),
      });
    }
  }

  // 결과를 환경변수 요청 시에만 파일로 저장 (테스트 사이드이펙트 방지)
  if (process.env.WRITE_VERIFICATION_REPORT === 'true') {
    const resultJsonPath =
      'C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f\\scratch\\verification_result.json';
    if (fs.existsSync('C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f\\scratch')) {
      fs.writeFileSync(resultJsonPath, JSON.stringify(reportData, null, 2), 'utf-8');
    }

    const resultMdPath =
      'C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f\\analysis_results.md';
    if (fs.existsSync('C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f')) {
      fs.writeFileSync(resultMdPath, md, 'utf-8');
    }
  }
});

function getWorldName(worldId: string): string {
  switch (worldId) {
    case 'World1':
      return '수와 연산';
    case 'World2':
      return '도형과 공간';
    case 'World3':
      return '확률과 통계';
    case 'World4':
      return '공학 및 응용';
    default:
      return worldId;
  }
}
