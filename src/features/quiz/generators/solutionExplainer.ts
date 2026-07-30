/**
 * 간단한 사칙연산 식을 평가하는 헬퍼 함수
 */
function evaluateSimpleExpr(expr: string): number {
  const parts = expr.split(/([+\-*/×÷])/).map((p) => p.trim());
  if (parts.length === 3) {
    const n1 = parseFloat(parts[0] || '0');
    const op = parts[1];
    const n2 = parseFloat(parts[2] || '0');
    if (op === '+') return n1 + n2;
    if (op === '-') return n1 - n2;
    if (op === '*' || op === '×') return n1 * n2;
    if (op === '/' || op === '÷') return n1 / n2;
  }
  return 0;
}

/**
 * 문제와 정답을 기반으로 상세한 풀이 과정(Step-by-step Solution)을 한국어로 생성합니다.
 */
export function getSolutionProcess(question: string, answer: string | number): string[] {
  const qStr = question.toString();
  const aStr = answer.toString();

  // 1. 수와 연산 (사칙연산) 관련 파싱
  if (
    qStr.includes('+') ||
    qStr.includes('-') ||
    qStr.includes('×') ||
    qStr.includes('÷') ||
    qStr.includes('*') ||
    qStr.includes('/')
  ) {
    // 2진수 덧셈이나 소수/부동소수점 예외 처리
    if (
      qStr.includes('2진수 덧셈') ||
      qStr.includes('2진수 소수') ||
      qStr.includes('부동소수점') ||
      qStr.includes('2진수')
    ) {
      // 아래 컴퓨터 공학 섹션으로 통과하도록 양보
    } else {
      // 괄호가 포함된 경우
      if (qStr.includes('(') && qStr.includes(')')) {
        const parenthesized = qStr.match(/\(([^)]+)\)/);
        if (parenthesized && parenthesized[1]) {
          const innerExpr = parenthesized[1];
          const innerVal = evaluateSimpleExpr(innerExpr);
          const outerExpr = qStr.replace(`(${innerExpr})`, String(innerVal));
          return [
            `1단계: 사칙연산 우선순위에 따라 괄호 안의 식 \`(${innerExpr})\`을 가장 먼저 계산합니다. 결과는 \`${innerVal}\`이 됩니다.`,
            `2단계: 괄호 계산 결과를 대입하여 남은 연산 \`${outerExpr}\`을 처리합니다.`,
            `3단계: 최종적으로 계산된 결과값은 \`${aStr}\`이 됩니다.`,
          ];
        }
      }

      // 3항 이상 연산인 경우
      // eslint-disable-next-line security/detect-unsafe-regex
      const numbers = (qStr.match(/\d+(\.\d+)?/g) || []).map(Number);
      const operators = qStr.match(/[+\-*/×÷]/g) || [];
      if (numbers.length === 3 && operators.length === 2) {
        const op1 = operators[0] || '';
        const op2 = operators[1] || '';
        const isOp2Priority =
          (op2 === '*' || op2 === '/' || op2 === '×' || op2 === '÷') &&
          (op1 === '+' || op1 === '-');
        if (isOp2Priority) {
          const val2 = evaluateSimpleExpr(`${numbers[1]} ${op2} ${numbers[2]}`);
          return [
            `1단계: 사칙연산 우선순위에 따라 곱셈/나눗셈 \`${numbers[1]} ${op2} ${numbers[2]}\`을 먼저 계산합니다. 결과는 \`${val2}\`입니다.`,
            `2단계: 앞의 숫자와 중간 계산 결과를 결합하여 \`${numbers[0]} ${op1} ${val2}\`을 계산합니다.`,
            `3단계: 모든 사칙연산을 완료하여 최종 정답 \`${aStr}\`을 도출합니다.`,
          ];
        } else {
          const val1 = evaluateSimpleExpr(`${numbers[0]} ${op1} ${numbers[1]}`);
          return [
            `1단계: 왼쪽부터 첫 번째 연산 \`${numbers[0]} ${op1} ${numbers[1]}\`을 계산합니다. 결과는 \`${val1}\`입니다.`,
            `2단계: 중간 계산 결과와 남은 피연산자를 결합하여 \`${val1} ${op2} ${numbers[2]}\`을 계산합니다.`,
            `3단계: 계산을 완료하여 최종 정답 \`${aStr}\`을 도출합니다.`,
          ];
        }
      }

      // 일반적인 2항 연산 (단출화 적용)
      if (numbers.length === 2) {
        return [
          `1단계: 주어진 두 수의 사칙연산 식 \`${qStr}\`을 확인합니다.`,
          `2단계: 계산을 완료하여 최종 정답 \`${aStr}\`을 도출합니다.`,
        ];
      }
    }
  }

  // 2. 확률과 통계 관련 파싱
  if (qStr.includes('평균')) {
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    return [
      `1단계: 평균을 구하기 위해 나열된 모든 숫자들 \`[${numbers.join(', ')}]\`을 전부 합산합니다. 합계는 \`${sum}\`입니다.`,
      `2단계: 전체 숫자의 개수인 \`${numbers.length}\`로 총합 \`${sum}\`을 나누는 나눗셈을 합니다. (\`${sum} ÷ ${numbers.length}\`)`,
      `3단계: 계산하여 나온 최종 평균값인 \`${aStr}\`을 정답으로 도출합니다.`,
    ];
  }

  if (qStr.includes('중앙값') || qStr.includes('Median')) {
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const sorted = [...numbers].sort((a, b) => a - b);
    if (sorted.length % 2 === 0 && sorted.length > 0) {
      const mid1 = sorted[sorted.length / 2 - 1]!;
      const mid2 = sorted[sorted.length / 2]!;
      const avg = (mid1 + mid2) / 2;
      return [
        `1단계: 주어진 숫자들을 크기 순으로 정렬합니다. 정렬 결과: \`[${sorted.join(', ')}]\``,
        `2단계: 데이터 개수가 짝수(${sorted.length}개)이므로, 가운데 위치한 두 값인 \`${mid1}\`과 \`${mid2}\`를 찾습니다.`,
        `3단계: 두 값의 평균인 \`(${mid1} + ${mid2}) ÷ 2 = ${avg}\`를 중앙값으로 도출합니다.`,
      ];
    } else {
      return [
        `1단계: 주어진 숫자들을 크기가 작은 순서대로 정렬합니다. 정렬 결과: \`[${sorted.join(', ')}]\``,
        `2단계: 홀수 개의 숫자이므로, 수열의 가장 정중앙(가운데)에 위치한 요소를 찾습니다.`,
        `3단계: 가운데에 위치한 숫자인 \`${aStr}\`이 중앙값이 됩니다.`,
      ];
    }
  }

  if (qStr.includes('최빈값') || qStr.includes('Mode')) {
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const counts: Record<number, number> = {};
    numbers.forEach((n) => {
      counts[n] = (counts[n] || 0) + 1;
    });
    const freqDesc = Object.entries(counts)
      .map(([num, count]) => `숫자 ${num}: ${count}회`)
      .join(', ');
    return [
      `1단계: 주어진 값들에서 각 숫자의 등장 빈도를 집계합니다. (${freqDesc})`,
      `2단계: 빈도수가 가장 높게 나타난(가장 많이 등장한) 숫자를 찾습니다.`,
      `3단계: 이에 따라 가장 많이 등장한 숫자인 \`${aStr}\`이 최빈값으로 결정됩니다.`,
    ];
  }

  if (qStr.includes('범위') || qStr.includes('최댓값과 최솟값의 차이')) {
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    return [
      `1단계: 나열된 수 중에서 가장 큰 수(최댓값)인 \`${max}\`와 가장 작은 수(최솟값)인 \`${min}\`을 각각 찾습니다.`,
      `2단계: 최댓값 \`${max}\`에서 최솟값 \`${min}\`을 빼는 뺄셈 식 \`${max} - ${min}\`을 세웁니다.`,
      `3단계: 뺄셈을 수행하여 정답인 범위 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('동전')) {
    const n = parseInt(qStr.match(/\d+/)?.[0] || '1', 10);
    return [
      `1단계: 동전 1개를 던질 때 나오는 경우의 수는 앞면, 뒷면 총 \`2\`가지입니다.`,
      `2단계: 동전 \`${n}\`개를 동시에 던지는 경우의 수 공식은 \`2^${n}\`이 됩니다.`,
      `3단계: \`2\`를 \`${n}\`번 곱하여 최종 경우의 수 \`${aStr}\`을 얻습니다.`,
    ];
  }

  if (qStr.includes('가위바위보')) {
    const n = parseInt(qStr.match(/\d+/)?.[0] || '1', 10);
    return [
      `1단계: 1명이 낼 수 있는 경우의 수는 가위, 바위, 보 총 \`3\`가지입니다.`,
      `2단계: \`${n}\`명이 동시에 가위바위보를 할 때의 경우의 수 공식은 \`3^${n}\`이 됩니다.`,
      `3단계: \`3\`을 \`${n}\`번 곱하여 최종 경우의 수 \`${aStr}\`을 얻습니다.`,
    ];
  }

  if (qStr.includes('주사위')) {
    return [
      `1단계: 두 주사위를 던질 때 두 눈의 합은 최소 2에서 최대 12까지 가능합니다.`,
      `2단계: 합이 7에 가까울수록 경우의 수가 증가하며, 합이 S일 때의 경우의 수는 공식 \`6 - |S - 7|\`로 빠른 도출이 가능합니다.`,
      `3단계: 합을 만족하는 조합들을 헤아려 최종 경우의 수 \`${aStr}\`을 구합니다.`,
    ];
  }

  if (qStr.includes('대표') || qStr.includes('뽑는 경우의 수')) {
    const n = parseInt(qStr.match(/\d+/)?.[0] || '1', 10);
    return [
      `1단계: \`${n}\`명 중 순서에 상관없이 대표 2명을 뽑는 조합(Combination) 공식 \`${n}C2\`를 적용합니다.`,
      `2단계: 공식은 \`(${n} × ${n - 1}) ÷ 2\`로 계산할 수 있습니다.`,
      `3단계: 분자 \`${n * (n - 1)}\`을 분모 \`2\`로 나누어 최종 경우의 수 \`${aStr}\`을 구합니다.`,
    ];
  }

  if (qStr.includes('한 줄로 세우는') || qStr.includes('나열하는')) {
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const n = numbers[0] || 1;
    const r = numbers[1] || n;

    if (r === n) {
      return [
        `1단계: \`${n}\`명을 남김없이 한 줄로 나열하는 팩토리얼(Factorial) 공식 \`${n}!\`을 적용합니다.`,
        `2단계: \`${n}\`부터 \`1\`까지의 모든 정수를 역순으로 곱해나갑니다. (\`${n} × ${n - 1} × ... × 1\`)`,
        `3단계: 모든 수의 곱인 최종 순열 수 \`${aStr}\`을 얻습니다.`,
      ];
    } else {
      return [
        `1단계: \`${n}\`명 중 \`${r}\`명을 선택하여 순서를 고려해 줄을 세우는 순열(Permutation) 공식 \`${n}P${r}\`을 적용합니다.`,
        `2단계: \`${n}\`부터 시작하여 하나씩 줄여가며 총 \`${r}\`개의 숫자를 곱해 나갑니다.`,
        `3단계: 최종적으로 곱한 값인 \`${aStr}\`을 정답으로 구합니다.`,
      ];
    }
  }

  if (qStr.includes('당첨') || qStr.includes('불량')) {
    const isDefective = qStr.includes('불량');
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const total = numbers[0] || 10;
    const target = numbers[1] || 1;

    if (isDefective) {
      return [
        `1단계: 전체 개수 \`${total}\`개 중 정상 제품의 개수는 \`${total} - ${target} = ${total - target}\`개입니다.`,
        `2단계: 무작위로 하나를 뽑았을 때 정상일 확률은 \`정상 개수 / 전체 개수\`이므로 \`${total - target} / ${total}\`이 됩니다.`,
        `3단계: 비율에 100을 곱하여 백분율(%) 정수값인 \`${aStr}%\`를 구합니다.`,
      ];
    } else {
      return [
        `1단계: 전체 개수 \`${total}\`개 중 당첨 제품의 개수는 \`${target}\`개입니다.`,
        `2단계: 당첨될 확률은 \`당첨 개수 / 전체 개수\`이므로 \`${target} / ${total}\`이 됩니다.`,
        `3단계: 비율에 100을 곱하여 백분율(%) 정수값인 \`${aStr}%\`를 구합니다.`,
      ];
    }
  }

  // 3. 도형과 공간 관련 파싱
  const shapeMatch = qStr.match(/([삼사오육칠팔구십\d]+)각형/);
  let parsedSides = 0;
  if (shapeMatch && shapeMatch[1]) {
    const name = shapeMatch[1];
    parsedSides = parseInt(name, 10);
    if (isNaN(parsedSides)) {
      if (name === '삼') parsedSides = 3;
      if (name === '사') parsedSides = 4;
      if (name === '오') parsedSides = 5;
      if (name === '육') parsedSides = 6;
      if (name === '칠') parsedSides = 7;
      if (name === '팔') parsedSides = 8;
      if (name === '구') parsedSides = 9;
      if (name === '십') parsedSides = 10;
    }
  }

  if (qStr.includes('꼭짓점 개수') || qStr.includes('변의 개수')) {
    const shapeName = shapeMatch ? shapeMatch[1] : '다각형';
    return [
      `1단계: 평면도형 \`${shapeName}각형\`의 형태적 성질을 확인합니다.`,
      `2단계: 다각형에서 'n각형'은 항상 꼭짓점 \`n\`개와 변 \`n\`개를 가집니다.`,
      `3단계: 이에 따라 최종 변/꼭짓점의 수인 \`${aStr}\`을 구합니다.`,
    ];
  }

  if (qStr.includes('대각선')) {
    const n = parsedSides || 5;
    return [
      `1단계: 다각형의 대각선 개수를 구하는 공식인 \`n × (n - 3) ÷ 2\`를 활용합니다.`,
      `2단계: \`${n}각형\`이므로 \`n = ${n}\`을 공식에 대입하면 식은 \`${n} × (${n} - 3) ÷ 2\`가 됩니다.`,
      `3단계: 연산을 처리하여 대각선 총 개수인 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('내각') && qStr.includes('나머지 한 각')) {
    const angles = (qStr.match(/\d+/g) || []).map(Number);
    const sum = angles.reduce((acc, a) => acc + a, 0);
    return [
      `1단계: 삼각형의 세 내각의 크기 합은 항상 \`180도\`입니다.`,
      `2단계: 알고 있는 두 각의 합인 \`${angles[0]} + ${angles[1]} = ${sum}도\`를 구합니다.`,
      `3단계: \`180도\`에서 두 각의 합을 뺀 나머지 각 \`180 - ${sum} = ${aStr}도\`를 도출합니다.`,
    ];
  }

  if (qStr.includes('평행사변형') && qStr.includes('이웃한 내각')) {
    const angle = parseInt(qStr.match(/\d+/)?.[0] || '60', 10);
    return [
      `1단계: 평행사변형에서 이웃한 두 내각의 크기 합은 항상 \`180도\`입니다.`,
      `2단계: 알고 있는 한 각의 크기가 \`${angle}도\`이므로, 식 \`180 - ${angle}\`을 계산합니다.`,
      `3단계: 뺄셈을 완료하여 이웃한 내각의 크기인 \`${aStr}도\`를 구합니다.`,
    ];
  }

  if (qStr.includes('직사각형') && qStr.includes('넓이')) {
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const w = numbers[0] || 1;
    const h = numbers[1] || 1;
    return [
      `1단계: 직사각형의 넓이 구하는 공식인 \`가로 × 세로\`를 사용합니다.`,
      `2단계: 문제에서 주어진 가로 길이 \`${w}\`와 세로 길이 \`${h}\`를 공식에 대입해 식 \`${w} × ${h}\`를 구성합니다.`,
      `3단계: 곱셈을 수행하여 최종 넓이인 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('삼각형') && qStr.includes('넓이')) {
    const numbers = (qStr.match(/\d+/g) || []).map(Number);
    const base = numbers[0] || 1;
    const height = numbers[1] || 1;
    return [
      `1단계: 삼각형의 넓이 구하는 공식인 \`(밑변 × 높이) ÷ 2\`를 사용합니다.`,
      `2단계: 밑변 길이 \`${base}\`와 높이 \`${height}\`를 대입해 식 \`(${base} × ${height}) ÷ 2\`를 세웁니다.`,
      `3단계: 연산을 완료하여 최종 넓이 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('원') && qStr.includes('지름')) {
    const val = parseInt(qStr.match(/\d+/)?.[0] || '1', 10);
    if (qStr.includes('반지름')) {
      return [
        `1단계: 원의 지름은 반지름의 \`2배\`가 되는 성질이 있습니다.`,
        `2단계: 주어진 반지름 \`${val}\`에 \`2\`를 곱해 줍니다. 식: \`${val} × 2\``,
        `3단계: 최종적으로 지름 \`${aStr}\`을 구합니다.`,
      ];
    } else {
      return [
        `1단계: 원의 반지름은 지름의 절반(\`1/2\`)이 되는 성질이 있습니다.`,
        `2단계: 주어진 지름 \`${val}\`을 \`2\`로 나누어 줍니다. 식: \`${val} ÷ 2\``,
        `3단계: 최종적으로 반지름 \`${aStr}\`을 구합니다.`,
      ];
    }
  }

  if (qStr.includes('원의 둘레') || qStr.includes('원의 넓이')) {
    const r = parseInt(qStr.match(/\d+/)?.[0] || '1', 10);
    if (qStr.includes('둘레')) {
      return [
        `1단계: 원의 둘레 구하는 공식인 \`2 × 반지름 × 원주율(3.1)\`을 사용합니다.`,
        `2단계: 반지름 \`${r}\`을 대입하여 \`2 × ${r} × 3.1\` 계산식을 만듭니다.`,
        `3단계: 소수 곱셈을 완료하여 원의 둘레인 \`${aStr}\`을 구합니다.`,
      ];
    } else {
      return [
        `1단계: 원의 넓이 구하는 공식인 \`반지름 × 반지름 × 원주율(3.1)\`을 사용합니다.`,
        `2단계: 반지름 \`${r}\`을 대입하여 \`${r} × ${r} × 3.1\` 계산식을 만듭니다.`,
        `3단계: 거듭제곱과 소수 곱셈을 처리하여 넓이 \`${aStr}\`을 구합니다.`,
      ];
    }
  }

  if (qStr.includes('대칭축의 개수')) {
    const n = qStr.match(/정(\d+)각형/)?.[1] || qStr.match(/정([삼사오육칠팔구십]+)각형/)?.[1];
    let numText = n;
    if (n === '삼') numText = '3';
    if (n === '사') numText = '4';
    if (n === '오') numText = '5';
    if (n === '육') numText = '6';
    if (n === '칠') numText = '7';
    if (n === '팔') numText = '8';

    return [
      `1단계: 정다각형은 완벽한 선대칭 및 회전대칭 구조를 이루고 있습니다.`,
      `2단계: 규칙성에 의해 '정${numText || 'n'}각형'의 선대칭축 개수는 항상 변(또는 꼭짓점)의 개수인 \`${numText || 'n'}\`개와 일치합니다.`,
      `3단계: 따라서 대칭축의 개수는 최종적으로 \`${aStr}\`개가 됩니다.`,
    ];
  }

  if (qStr.includes('피타고라스') || qStr.includes('직각삼각형')) {
    return [
      `1단계: 직각삼각형의 두 직각변 $a, b$와 빗변 $c$ 사이에는 피타고라스 정리 $a^2 + b^2 = c^2$이 성립합니다.`,
      `2단계: 자주 사용되는 피타고라스 삼조 정수비(3:4:5, 5:12:13, 8:15:17, 7:24:25 등)의 비율을 적용합니다.`,
      `3단계: 미지의 변의 길이를 산출하여 최종 정답 \`${aStr}\`을 얻습니다.`,
    ];
  }

  if (qStr.includes('입체도형') || qStr.includes('기둥') || qStr.includes('뿔')) {
    return [
      `1단계: 입체도형의 모서리, 꼭짓점, 면의 개수를 구하는 수학적 규칙을 활용합니다.`,
      `2단계: n각기둥의 꼭짓점은 2n개, 모서리는 3n개, 면은 n+2개이며, n각뿔의 꼭짓점은 n+1개, 모서리는 2n개, 면은 n+1개입니다.`,
      `3단계: 규칙식에 대입하여 최종 개수 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('직육면체의 부피') || qStr.includes('원기둥의 부피')) {
    // eslint-disable-next-line security/detect-unsafe-regex
    const numbers = (qStr.match(/\d+(\.\d+)?/g) || []).map(Number);
    if (qStr.includes('원기둥')) {
      const r = numbers[0] || 1;
      const h = numbers[1] || 1;
      return [
        `1단계: 원기둥의 부피 공식인 \`밑넓이 × 높이\` 즉 \`원주율(3.1) × 반지름² × 높이\`를 사용합니다.`,
        `2단계: 주어진 반지름과 높이를 적용한 \`3.1 × ${r}² × ${h}\`에 값을 대입해 계산합니다.`,
        `3단계: 소수 곱셈을 완료하여 최종 부피인 \`${aStr}\`을 얻습니다.`,
      ];
    } else {
      const w = numbers[0] || 1;
      const h = numbers[1] || 1;
      const d = numbers[2] || 1;
      return [
        `1단계: 직육면체의 부피 공식인 \`가로 × 세로 × 높이\`를 사용합니다.`,
        `2단계: 세 변의 길이를 곱하는 식 \`${w} × ${h} × ${d}\`를 대입하여 연산합니다.`,
        `3단계: 곱셈을 완료하여 최종 부피 \`${aStr}\`을 얻습니다.`,
      ];
    }
  }

  if (qStr.includes('정육면체의 겉넓이')) {
    const s = parseInt(qStr.match(/\d+/)?.[0] || '1', 10);
    return [
      `1단계: 정육면체의 겉넓이는 면적이 동일한 6개의 정사각형 면들의 넓이 총합입니다.`,
      `2단계: 정사각형 한 면의 넓이는 \`한 변(s)²\`이므로 전체 겉넓이 공식은 \`6 × s²\` 즉 \`6 × ${s}²\`이 됩니다.`,
      `3단계: 곱셈을 완료하여 최종 겉넓이 \`${aStr}\`을 도출합니다.`,
    ];
  }

  // 4. 컴퓨터 공학 (공학 및 응용) 관련 파싱
  if (qStr.includes('2진수') && qStr.includes('10진수')) {
    const binary = qStr.match(/[01]+/)?.[0] || '';
    const additionParts: string[] = [];
    const len = binary.length;
    for (let i = 0; i < len; i++) {
      const bit = binary[i];
      const weight = Math.pow(2, len - 1 - i);
      if (bit === '1') {
        additionParts.push(String(weight));
      }
    }
    const sumExpr = additionParts.length > 0 ? additionParts.join(' + ') : '0';
    return [
      `1단계: 2진수 \`${binary}\`의 각 비트 자리에 가중치($2^n$)를 매깁니다. 우측 끝부터 1, 2, 4, 8... 순서입니다.`,
      `2단계: 비트가 \`1\`로 표시된 자리의 가중치들합산하는 식 \`${sumExpr}\`을 세웁니다.`,
      `3단계: 합산 결과를 통해 최종 10진수 값인 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('10진수') && qStr.includes('2진수')) {
    const num = parseInt(qStr.match(/\d+/)?.[0] || '1', 10);
    let temp = num;
    const decomposition: number[] = [];
    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    for (const w of weights) {
      if (temp >= w && w <= num) {
        decomposition.push(w);
        temp -= w;
      }
    }
    const decompositionExpr = decomposition.join(' + ');
    return [
      `1단계: 10진수 \`${num}\`을 2의 거듭제곱 가중치들의 합인 \`${decompositionExpr}\`로 분해합니다.`,
      `2단계: 분해에 사용된 가중치 자리 비트는 \`1\`, 사용되지 않은 자리 비트는 \`0\`으로 채웁니다.`,
      `3단계: 채워진 비트열들을 연결해 2진수 정답 \`${aStr}\`을 구합니다.`,
    ];
  }

  if (qStr.includes('16진수') && qStr.includes('10진수')) {
    const hex = qStr.match(/16진수 ([0-9A-F]+)/)?.[1] || '';
    const additionParts: string[] = [];
    const len = hex.length;
    for (let i = 0; i < len; i++) {
      const char = hex[i]!;
      let val = parseInt(char, 10);
      if (isNaN(val)) {
        val = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      }
      const weight = Math.pow(16, len - 1 - i);
      additionParts.push(`(${val} × ${weight})`);
    }
    const sumExpr = additionParts.join(' + ');
    return [
      `1단계: 16진수 \`${hex}\`의 자리수 가중치(16의 거듭제곱)를 뒤에서부터 매깁니다. 끝자리는 1의 자리, 앞자리는 16의 자리입니다.`,
      `2단계: 알파벳 문자 값 변환 결과를 곱하여 합하는 식 \`${sumExpr}\`을 구성합니다.`,
      `3단계: 연산을 처리하여 최종 10진수 결과 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('AND') || qStr.includes('OR') || qStr.includes('XOR') || qStr.includes('NOT')) {
    const op = qStr.includes('AND')
      ? 'AND'
      : qStr.includes('OR')
        ? 'OR'
        : qStr.includes('XOR')
          ? 'XOR'
          : 'NOT';
    if (op === 'NOT') {
      const bit = qStr.match(/\d+/)?.[0] || '0';
      return [
        `1단계: NOT 연산은 입력 비트를 반전시키는 논리 부정 게이트입니다.`,
        `2단계: 입력 \`${bit}\`를 역으로 뒤집는 식 \`NOT ${bit}\`을 실행합니다.`,
        `3단계: 최종 결과인 \`${aStr}\`을 도출합니다.`,
      ];
    } else {
      const bits = (qStr.match(/\d+/g) || []).map(Number);
      const b1 = bits[0] ?? 0;
      const b2 = bits[1] ?? 0;
      let desc = '';
      if (op === 'AND') desc = '두 입력이 모두 1일 때만 1';
      if (op === 'OR') desc = '두 입력 중 하나라도 1이면 1';
      if (op === 'XOR') desc = '두 입력 비트가 다르면 1';

      return [
        `1단계: \`${op}\` 연산의 게이트 진리표 규칙(${desc})을 활용합니다.`,
        `2단계: 입력된 피연산자 비트로 구성한 논리식 \`${b1} ${op} ${b2}\`를 연산합니다.`,
        `3단계: 최종 연산 결과 비트값 \`${aStr}\`을 정답으로 구합니다.`,
      ];
    }
  }

  if (qStr.includes('바이트') || qStr.includes('KB') || qStr.includes('MB')) {
    return [
      `1단계: 컴퓨터의 메모리 단위 간 변환 관계인 \`1 KB = 1024 Byte\`, \`1 MB = 1024 KB\` 규칙을 적용합니다.`,
      `2단계: 변환의 크기에 따라 곱하기 또는 나누기 1024의 정수배 연산을 진행합니다.`,
      `3단계: 연산을 거쳐 변환된 최종 크기 수치인 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('스택') || qStr.includes('Stack')) {
    return [
      `1단계: 자료구조 스택(Stack)은 마지막에 저장된 것이 가장 먼저 추출되는 후입선출(LIFO) 특성을 지닙니다.`,
      `2단계: 명령어의 흐름(push: 넣기, pop: 빼기)을 추적하며 스택에 적재된 데이터 리스트의 변화를 구합니다.`,
      `3단계: 최종적으로 최상단에 남은 원소의 값인 \`${aStr}\`을 정답으로 도출합니다.`,
    ];
  }

  if (qStr.includes('큐') || qStr.includes('Queue')) {
    return [
      `1단계: 자료구조 큐(Queue)는 먼저 저장된 것이 가장 먼저 추출되는 선입선출(FIFO) 특성을 지닙니다.`,
      `2단계: 명령어의 흐름(enqueue: 대기열 추가, dequeue: 먼저 들어간 것 꺼내기)을 순서대로 트래킹합니다.`,
      `3단계: 대기열의 가장 전면(front)에 위치한 최종적인 데이터값 \`${aStr}\`을 구합니다.`,
    ];
  }

  if (qStr.includes('보수')) {
    const isOne = qStr.includes('1의 보수');
    const binary = qStr.match(/[01]+/)?.[0] || '';
    if (isOne) {
      const inverted = binary
        .split('')
        .map((b) => (b === '0' ? '1' : '0'))
        .join('');
      return [
        `1단계: 1의 보수법은 2진수의 모든 비트 값을 기계적으로 반전시키는 연산입니다.`,
        `2단계: 입력 \`${binary}\`의 각 자리를 반전한 비트열 식 \`~${binary}\`을 적용합니다.`,
        `3단계: 반전 완료한 비트열인 \`${inverted}\`(즉, \`${aStr}\`)을 정답으로 구합니다.`,
      ];
    } else {
      const inverted = binary
        .split('')
        .map((b) => (b === '0' ? '1' : '0'))
        .join('');
      return [
        `1단계: 2의 보수법은 1의 보수(비트 반전) 결과에 \`1\`을 더한 값입니다.`,
        `2단계: 반전 비트열 \`${inverted}\`에 \`+1\`을 수행하는 계산식 \`${inverted} + 1\`을 만듭니다.`,
        `3단계: 받아올림을 올바르게 계산하여 최종 비트열인 \`${aStr}\`을 도출합니다.`,
      ];
    }
  }

  if (qStr.includes('2진수 덧셈')) {
    const binaries = qStr.match(/[01]+/g) || [];
    const bin1 = binaries[0] || '0';
    const bin2 = binaries[1] || '0';
    return [
      `1단계: 2진수 덧셈 식 \`${bin1} + ${bin2}\`를 세로셈 형태로 확인합니다.`,
      `2단계: 자릿수 합이 2 이상이 되는 순간 윗자리로 받아올림(Carry)을 발생시키며 연산합니다.`,
      `3단계: 합산된 최종 2진수 합계 \`${aStr}\`을 도출합니다.`,
    ];
  }

  if (qStr.includes('2진수 소수') || qStr.includes('부동소수점')) {
    return [
      `1단계: 2진수 소수점 이하 비트들은 소수 첫째 자리부터 $2^{-1}(0.5)$, $2^{-2}(0.25)$, $2^{-3}(0.125)$의 가중치를 가집니다.`,
      `2단계: 소수점 연산 시 각 자릿수의 가중치를 적용하여 10진수로 변환하거나, 2진 덧셈 규칙에 맞춰 더합니다.`,
      `3단계: 계산하여 산출한 최종 정답인 \`${aStr}\`을 얻습니다.`,
    ];
  }

  // 5. 기본 폴백(Fallback) 해설 (단출화 적용)
  return [
    `1단계: 유형별 상세 풀이 과정이 지원되지 않는 레벨입니다.`,
    `2단계: 게임 화면에 노출되는 게임 팁과 힌트를 참고하여 문제를 풀어주세요.`,
  ];
}
