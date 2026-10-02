import { describe, it, expect } from 'vitest';
import { getSolutionProcess } from '@/features/quiz/generators/solutionExplainer';

describe('getSolutionProcess', () => {
  describe('Arithmetic', () => {
    it('should contain "괄호" for expression with parentheses', () => {
      const result = getSolutionProcess('(2 + 3) * 4');
      const text = result.join(' ');
      expect(text).toContain('괄호');
    });

    it('should contain "곱셈/나눗셈" for expression with multiplication', () => {
      const result = getSolutionProcess('2 + 3 * 4');
      const text = result.join(' ');
      expect(text).toContain('곱셈/나눗셈');
    });

    it('should contain "사칙연산 식" for simple addition', () => {
      const result = getSolutionProcess('5 + 3');
      const text = result.join(' ');
      expect(text).toContain('사칙연산 식');
    });
  });

  describe('Statistics', () => {
    it('should contain "평균" for average calculation', () => {
      const result = getSolutionProcess('평균 10 20 30');
      const text = result.join(' ');
      expect(text).toContain('평균');
    });

    it('should contain "중앙값" for median calculation with odd number of elements', () => {
      const result = getSolutionProcess('중앙값 1 2 3');
      const text = result.join(' ');
      expect(text).toContain('중앙값');
    });

    it('should contain "중앙값" for median calculation with even number of elements', () => {
      const result = getSolutionProcess('중앙값 1 2 3 4');
      const text = result.join(' ');
      expect(text).toContain('중앙값');
    });

    it('should contain "최빈값" for mode calculation', () => {
      const result = getSolutionProcess('최빈값 1 2 2 3');
      const text = result.join(' ');
      expect(text).toContain('최빈값');
    });

    it('should contain "범위" for range calculation', () => {
      const result = getSolutionProcess('범위 1 5');
      const text = result.join(' ');
      expect(text).toContain('범위');
    });

    it('should contain "동전" for coin probability', () => {
      const result = getSolutionProcess('동전 3개');
      const text = result.join(' ');
      expect(text).toContain('동전');
    });

    it('should contain "가위바위보" for rock-paper-scissors probability', () => {
      const result = getSolutionProcess('가위바위보 3명');
      const text = result.join(' ');
      expect(text).toContain('가위바위보');
    });

    it('should contain "주사위" for dice probability', () => {
      const result = getSolutionProcess('주사위');
      const text = result.join(' ');
      expect(text).toContain('주사위');
    });

    it('should contain "대표" for combination', () => {
      const result = getSolutionProcess('대표 5명 중 대표 2명');
      const text = result.join(' ');
      expect(text).toContain('대표');
    });

    it('should contain "팩토리얼" for factorial calculation', () => {
      const result = getSolutionProcess('4명을 한 줄로 세우는');
      const text = result.join(' ');
      expect(text).toContain('팩토리얼');
    });

    it('should contain "순열" for permutation calculation', () => {
      const result = getSolutionProcess('5명 중 3명을 나열하는');
      const text = result.join(' ');
      expect(text).toContain('순열');
    });

    it('should contain "정상" for defective item probability', () => {
      const result = getSolutionProcess('불량 5개');
      const text = result.join(' ');
      expect(text).toContain('정상');
    });

    it('should contain "당첨" for winning probability', () => {
      const result = getSolutionProcess('당첨 2개');
      const text = result.join(' ');
      expect(text).toContain('당첨');
    });
  });

  describe('Geometry', () => {
    it('should contain "꼭짓점" for number of vertices', () => {
      const result = getSolutionProcess('오각형의 꼭짓점 개수');
      const text = result.join(' ');
      expect(text).toContain('꼭짓점');
    });

    it('should contain "대각선" for number of diagonals', () => {
      const result = getSolutionProcess('육각형의 대각선');
      const text = result.join(' ');
      expect(text).toContain('대각선');
    });

    it('should contain "180도" for angle sum in triangle', () => {
      const result = getSolutionProcess('내각 60도 70도 나머지 한 각');
      const text = result.join(' ');
      expect(text).toContain('180도');
    });

    it('should contain "180도" for adjacent angles in parallelogram', () => {
      const result = getSolutionProcess('평행사변형 이웃한 내각 70도');
      const text = result.join(' ');
      expect(text).toContain('180도');
    });

    it('should contain "가로 × 세로" for area of rectangle', () => {
      const result = getSolutionProcess('직사각형 넓이');
      const text = result.join(' ');
      expect(text).toContain('가로 × 세로');
    });

    it('should contain "밑변" for area of triangle', () => {
      const result = getSolutionProcess('삼각형 넓이');
      const text = result.join(' ');
      expect(text).toContain('밑변');
    });

    it('should contain "지름" for diameter of circle', () => {
      const result = getSolutionProcess('원의 지름 10');
      const text = result.join(' ');
      expect(text).toContain('지름');
    });

    it('should contain "반지름" for radius of circle', () => {
      const result = getSolutionProcess('원의 반지름 5');
      const text = result.join(' ');
      expect(text).toContain('반지름');
    });

    it('should contain "둘레" for circumference of circle', () => {
      const result = getSolutionProcess('원의 둘레 5');
      const text = result.join(' ');
      expect(text).toContain('둘레');
    });

    it('should contain "넓이" for area of circle', () => {
      const result = getSolutionProcess('원의 넓이 3');
      const text = result.join(' ');
      expect(text).toContain('넓이');
    });

    it('should contain "대칭축" for number of axes of symmetry', () => {
      const result = getSolutionProcess('정오각형 대칭축의 개수');
      const text = result.join(' ');
      expect(text).toContain('대칭축');
    });

    it('should contain "피타고라스" for Pythagorean theorem', () => {
      const result = getSolutionProcess('피타고라스 직각삼각형');
      const text = result.join(' ');
      expect(text).toContain('피타고라스');
    });

    it('should contain "입체도형" for general 3D shape', () => {
      const result = getSolutionProcess('입체도형 기둥');
      const text = result.join(' ');
      expect(text).toContain('입체도형');
    });

    it('should contain "원기둥" for volume of cylinder', () => {
      const result = getSolutionProcess('원기둥의 부피');
      const text = result.join(' ');
      expect(text).toContain('원기둥');
    });

    it('should contain "직육면체" for volume of rectangular prism', () => {
      const result = getSolutionProcess('직육면체의 부피');
      const text = result.join(' ');
      expect(text).toContain('직육면체');
    });

    it('should contain "겉넓이" for surface area of cube', () => {
      const result = getSolutionProcess('정육면체의 겉넓이');
      const text = result.join(' ');
      expect(text).toContain('겉넓이');
    });
  });

  describe('CS', () => {
    it('should contain "10진수" for binary to decimal conversion', () => {
      const result = getSolutionProcess('2진수를 10진수로');
      const text = result.join(' ');
      expect(text).toContain('10진수');
    });

    it('should contain "2진수" for decimal to binary conversion', () => {
      const result = getSolutionProcess('10진수를 2진수로');
      const text = result.join(' ');
      expect(text).toContain('2진수');
    });

    it('should contain "16진수" for hexadecimal number', () => {
      const result = getSolutionProcess('16진수 1A를 10진수로 변환', '26');
      const text = result.join(' ');
      expect(text).toContain('16진수');
    });

    it('should contain "AND" for bitwise AND operation', () => {
      const result = getSolutionProcess('1 AND 1');
      const text = result.join(' ');
      expect(text).toContain('AND');
    });

    it('should contain "OR" for bitwise OR operation', () => {
      const result = getSolutionProcess('1 OR 0');
      const text = result.join(' ');
      expect(text).toContain('OR');
    });

    it('should contain "XOR" for bitwise XOR operation', () => {
      const result = getSolutionProcess('1 XOR 0');
      const text = result.join(' ');
      expect(text).toContain('XOR');
    });

    it('should contain "NOT" for bitwise NOT operation', () => {
      const result = getSolutionProcess('NOT 1');
      const text = result.join(' ');
      expect(text).toContain('NOT');
    });

    it('should contain "Byte" for byte to kilobyte conversion', () => {
      const result = getSolutionProcess('1024 바이트 KB');
      const text = result.join(' ');
      expect(text).toContain('Byte');
    });

    it('should contain "스택" for stack data structure', () => {
      const result = getSolutionProcess('스택 Stack');
      const text = result.join(' ');
      expect(text).toContain('스택');
    });

    it('should contain "큐" for queue data structure', () => {
      const result = getSolutionProcess('큐 Queue');
      const text = result.join(' ');
      expect(text).toContain('큐');
    });

    it('should contain "1의 보수" for one\'s complement', () => {
      const result = getSolutionProcess('1의 보수');
      const text = result.join(' ');
      expect(text).toContain('1의 보수');
    });

    it('should contain "2의 보수" for two\'s complement', () => {
      const result = getSolutionProcess('2의 보수');
      const text = result.join(' ');
      expect(text).toContain('2의 보수');
    });

    it('should contain "2진수 덧셈" for binary addition', () => {
      const result = getSolutionProcess('2진수 덧셈');
      const text = result.join(' ');
      expect(text).toContain('2진수 덧셈');
    });

    it('should contain "2진수 소수" for binary prime number', () => {
      const result = getSolutionProcess('2진수 소수');
      const text = result.join(' ');
      expect(text).toContain('2진수 소수');
    });
  });

  describe('Fallback/Null safety', () => {
    it('should contain "지원되지 않는" for unknown problem', () => {
      const result = getSolutionProcess('알 수 없는 문제');
      const text = result.join(' ');
      expect(text).toContain('지원되지 않는');
    });

    it('should contain "지원되지 않는" for null input', () => {
      const result = getSolutionProcess(null);
      const text = result.join(' ');
      expect(text).toContain('지원되지 않는');
    });

    it('should contain "지원되지 않는" for undefined input', () => {
      const result = getSolutionProcess(undefined);
      const text = result.join(' ');
      expect(text).toContain('지원되지 않는');
    });
  });
});
