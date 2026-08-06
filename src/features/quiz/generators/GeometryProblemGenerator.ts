import { Difficulty } from '../types/quiz';

export interface GeometryProblem {
  question: string;
  answer: number | string;
  inputType?: 'number' | 'decimal' | 'fraction' | 'coordinate';
}

function getRandomInt(
  min: number,
  max: number,
  rng?: { randomInt: (min: number, max: number) => number }
): number {
  if (rng) return rng.randomInt(min, max + 1);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateGeometryProblem(
  level: number,
  _difficulty: Difficulty,
  rng?: { random: () => number; randomInt: (min: number, max: number) => number }
): GeometryProblem {
  if (level > 15) {
    const randomVal = rng ? rng.randomInt(1, 8) : Math.floor(Math.random() * 8) + 1;
    switch (randomVal) {
      case 1:
        return generateSolidVolume(rng);
      case 2:
        return generateSolidSurfaceArea(rng);
      case 3:
        return generateCoordinateDistance(rng);
      case 4:
        return generateTrigonometry(rng);
      case 5:
        return generatePythagoreanAdvanced(rng);
      case 6:
        return generateCoordinateMidpoint(rng);
      case 7:
        return generateLineSlope(rng);
      case 8:
        return generateCircleEqBasic(rng);
      default:
        return generateSolidVolume(rng);
    }
  }

  switch (level) {
    case 1:
      return generateBasicShapes(rng);
    case 2:
      return generateSymmetry(rng);
    case 3:
      return generateTriangleProperties(rng);
    case 4:
      return generateQuadrilateralProperties(rng);
    case 5:
      return generateAreaRect(rng);
    case 6:
      return generateAreaTriangle(rng);
    case 7:
      return generateAreaTrapezoid(rng);
    case 8:
      return generateCircleBasic(rng);
    case 9:
      return generateCircleCircumference(rng);
    case 10:
      return generateCircleArea(rng);
    case 11:
      return generateBasicShapesDiagonal(rng);
    case 12:
      return generateSolidBasic(rng);
    case 13:
      return generateSolidVolumeRect(rng);
    case 14:
      return generatePythagoreanBasic(rng);
    case 15:
      return generateTrigonometryBasic(rng);
    default:
      return generateBasicShapes(rng);
  }
}

// ... existing helper functions (omitted for brevity in replacement, but I will keep them)

function generateCoordinateMidpoint(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const x1 = getRandomInt(-10, 10, rng) * 2;
  const y1 = getRandomInt(-10, 10, rng) * 2;
  const x2 = getRandomInt(-10, 10, rng) * 2;
  const y2 = getRandomInt(-10, 10, rng) * 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return {
    question: `두 점 (${x1}, ${y1})과 (${x2}, ${y2})의 중점의 좌표 (x, y)에서 x+y의 값은?`,
    answer: mx + my,
  };
}

function generateLineSlope(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const x1 = getRandomInt(-5, 5, rng);
  const x2 = x1 + getRandomInt(1, 5, rng);
  const m = getRandomInt(-3, 3, rng);
  const y1 = getRandomInt(-5, 5, rng);
  const y2 = y1 + m * (x2 - x1);
  return {
    question: `두 점 (${x1}, ${y1})과 (${x2}, ${y2})를 지나는 직선의 기울기는?`,
    answer: m,
  };
}

function generateCircleEqBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const r = getRandomInt(2, 10, rng);
  const rSquared = r * r;
  return {
    question: `원 x² + y² = k [반지름 ${r}] ➔ k = ?`,
    answer: rSquared,
  };
}

function generateBasicShapes(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const shapes = [
    { name: '삼각형', vertices: 3 },
    { name: '사각형', vertices: 4 },
    { name: '오각형', vertices: 5 },
    { name: '육각형', vertices: 6 },
    { name: '칠각형', vertices: 7 },
    { name: '팔각형', vertices: 8 },
  ];
  const shape = shapes[getRandomInt(0, shapes.length - 1, rng)];
  return {
    question: '이 도형의 꼭짓점 수 = ?',
    answer: shape.vertices,
    hintType: 'shape-visualizer',
    hintData: {
      sides: shape.vertices,
      shapeName: shape.name,
    },
  } as any;
}

function generateBasicShapesDiagonal(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const shapes = [
    { name: '사각형', diagonals: 2 },
    { name: '오각형', diagonals: 5 },
    { name: '육각형', diagonals: 9 },
    { name: '칠각형', diagonals: 14 },
    { name: '팔각형', diagonals: 20 },
    { name: '구각형', diagonals: 27 },
  ];
  const idx = Math.abs(getRandomInt(0, shapes.length - 1, rng)) % shapes.length;
  const shape = shapes[idx] || shapes[0]!;
  return {
    question: `${shape.name} 대각선 = ?`,
    answer: shape.diagonals,
  };
}

function generateTriangleProperties(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const a = getRandomInt(20, 100, rng);
  const b = getRandomInt(10, 160 - a, rng);
  const c = 180 - a - b;
  return {
    question: `삼각형 내각: ${a}°, ${b}°, [ ? ]°`,
    answer: c,
  };
}

function generateQuadrilateralProperties(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const isAdjacent = getRandomInt(0, 1, rng) === 1;
  const a = getRandomInt(30, 150, rng);
  if (isAdjacent) {
    const b = 180 - a;
    return {
      question: `평행사변형 [한 각 ${a}°] ➔ 이웃한 각 = ?°`,
      answer: b,
    };
  } else {
    return {
      question: `평행사변형 [한 각 ${a}°] ➔ 마주보는 각 = ?°`,
      answer: a,
    };
  }
}

function generateAreaRect(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const w = getRandomInt(2, 12, rng);
  const h = getRandomInt(2, 12, rng);
  return {
    question: `직사각형 [가로 ${w} × 세로 ${h}] 넓이 = ?`,
    answer: w * h,
  };
}

function generateAreaTriangle(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const b = getRandomInt(2, 10, rng) * 2;
  const h = getRandomInt(2, 10, rng);
  return {
    question: `삼각형 [밑변 ${b} × 높이 ${h}] 넓이 = ?`,
    answer: (b * h) / 2,
  };
}

function generateCircleBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const r = getRandomInt(2, 15, rng);
  return {
    question: `원 [반지름 ${r}] ➔ 지름 = ?`,
    answer: r * 2,
  };
}

export function generateCircleAdvanced(rng?: {
  random: () => number;
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const randomVal = rng ? rng.random() : Math.random();
  const type = randomVal > 0.5 ? '둘레' : '넓이';

  const r = getRandomInt(1, 10, rng);
  if (type === '둘레') {
    const answer = Math.round(2 * 3.1 * r * 10) / 10;
    return {
      question: `원 [반지름 ${r}, π=3.1] 둘레 = ?`,
      answer: answer,
      inputType: Number.isInteger(answer) ? 'number' : 'decimal',
    };
  } else {
    const answer = Math.round(3.1 * r * r * 10) / 10;
    return {
      question: `원 [반지름 ${r}, π=3.1] 넓이 = ?`,
      answer: answer,
      inputType: Number.isInteger(answer) ? 'number' : 'decimal',
    };
  }
}

function generateSolidBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const n = getRandomInt(3, 8, rng);
  const isPrism = getRandomInt(0, 1, rng) === 1;
  if (isPrism) {
    return {
      question: `${n}각기둥 모서리 = ?`,
      answer: n * 3,
    };
  } else {
    return {
      question: `${n}각뿔 꼭짓점 = ?`,
      answer: n + 1,
    };
  }
}

function generateSymmetry(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const n = getRandomInt(3, 10, rng);
  const koreanNames: Record<number, string> = {
    3: '정삼각형',
    4: '정사각형',
    5: '정오각형',
    6: '정육각형',
    7: '정칠각형',
    8: '정팔각형',
    9: '정구각형',
    10: '정십각형',
  };
  return {
    question: `${koreanNames[n]} 선대칭축 = ?`,
    answer: n,
  };
}

export function generatePythagorean(rng?: {
  random: () => number;
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const triples = [
    { a: 3, b: 4, c: 5 },
    { a: 5, b: 12, c: 13 },
    { a: 6, b: 8, c: 10 },
    { a: 8, b: 15, c: 17 },
  ];
  const triple = triples[getRandomInt(0, triples.length - 1, rng)];
  const randomVal = rng ? rng.random() : Math.random();
  const hide = randomVal > 0.5 ? 'c' : 'b';

  if (hide === 'c') {
    return {
      question: `직각삼각형 [밑변 ${triple.a}, 높이 ${triple.b}] ➔ 빗변 = ?`,
      answer: triple.c,
    };
  } else {
    return {
      question: `직각삼각형 [빗변 ${triple.c}, 한 변 ${triple.a}] ➔ 다른 변 = ?`,
      answer: triple.b,
    };
  }
}

function generateSolidVolume(rng?: {
  random: () => number;
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const isCylinder = rng ? rng.random() > 0.5 : Math.random() > 0.5;
  if (isCylinder) {
    const r = getRandomInt(2, 5, rng);
    const h = getRandomInt(3, 10, rng);
    const answer = Math.round(3.1 * r * r * h * 10) / 10;
    return {
      question: `원기둥 [반지름 ${r}, 높이 ${h}, π=3.1] 부피 = ?`,
      answer: answer,
      inputType: Number.isInteger(answer) ? 'number' : 'decimal',
    };
  } else {
    const w = getRandomInt(2, 8, rng);
    const d = getRandomInt(2, 8, rng);
    const h = getRandomInt(3, 10, rng);
    return {
      question: `직육면체 [${w} × ${d} × ${h}] 부피 = ?`,
      answer: w * d * h,
      inputType: 'number',
    };
  }
}

function generateSolidSurfaceArea(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const s = getRandomInt(2, 10, rng);
  return {
    question: `정육면체 [한 변 ${s}] 겉넓이 = ?`,
    answer: 6 * s * s,
  };
}

function generateCoordinateDistance(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const triples = [
    { a: 3, b: 4, c: 5 },
    { a: 5, b: 12, c: 13 },
    { a: 6, b: 8, c: 10 },
    { a: 8, b: 15, c: 17 },
  ];
  const triple = triples[getRandomInt(0, triples.length - 1, rng)];
  const x1 = getRandomInt(-5, 5, rng);
  const y1 = getRandomInt(-5, 5, rng);
  const x2 = x1 + triple.a;
  const y2 = y1 + triple.b;
  return {
    question: `두 점 (${x1}, ${y1}), (${x2}, ${y2}) 거리 = ?`,
    answer: triple.c,
  };
}

function generateTrigonometry(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const questions = [
    { q: 'sin(30°)', a: '1/2' },
    { q: 'cos(60°)', a: '1/2' },
    { q: 'tan(45°)', a: '1' },
  ];
  const idx = Math.abs(getRandomInt(0, questions.length - 1, rng)) % questions.length;
  const item = questions[idx] || questions[0]!;
  return {
    question: `${item.q} 값 = ?`,
    answer: item.a,
  };
}

function generatePythagoreanAdvanced(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const triples = [
    { a: 7, b: 24, c: 25 },
    { a: 9, b: 40, c: 41 },
    { a: 11, b: 60, c: 61 },
  ];
  const t =
    triples[Math.abs(getRandomInt(0, triples.length - 1, rng)) % triples.length] || triples[0]!;
  return {
    question: `직각삼각형 [밑변 ${t.a}, 높이 ${t.b}] ➔ 빗변 = ?`,
    answer: t.c,
  };
}

function generateAreaTrapezoid(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const top = getRandomInt(1, 5, rng);
  const bottom = top + getRandomInt(1, 5, rng) * 2;
  const height = getRandomInt(2, 6, rng);
  const area = ((top + bottom) * height) / 2;
  return {
    question: `사다리꼴 [윗변 ${top}, 아랫변 ${bottom}, 높이 ${height}] 넓이 = ?`,
    answer: area,
  };
}

function generateCircleCircumference(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const radii = [2, 5, 10, 20];
  const r = radii[Math.abs(getRandomInt(0, radii.length - 1, rng)) % radii.length] || 10;
  const answer = Math.round(2 * 3.1 * r * 10) / 10;
  return {
    question: `원 [반지름 ${r}, π=3.1] 둘레 = ?`,
    answer: answer,
    inputType: Number.isInteger(answer) ? 'number' : 'decimal',
  };
}

function generateCircleArea(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const radii = [2, 5, 10];
  const r = radii[Math.abs(getRandomInt(0, radii.length - 1, rng)) % radii.length] || 10;
  const answer = Math.round(3.1 * r * r * 10) / 10;
  return {
    question: `원 [반지름 ${r}, π=3.1] 넓이 = ?`,
    answer: answer,
    inputType: Number.isInteger(answer) ? 'number' : 'decimal',
  };
}

function generateSolidVolumeRect(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const w = getRandomInt(2, 5, rng);
  const d = getRandomInt(2, 4, rng);
  const h = getRandomInt(2, 5, rng);
  return {
    question: `직육면체 [${w} × ${d} × ${h}] 부피 = ?`,
    answer: w * d * h,
    inputType: 'number',
  };
}

function generatePythagoreanBasic(_rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  return {
    question: `직각삼각형 [밑변 3, 높이 4] ➔ 빗변 = ?`,
    answer: 5,
  };
}

function generateTrigonometryBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const questions = [
    { q: 'tan(45°)', a: 1 },
    { q: 'sin(30°)', a: '1/2' },
    { q: 'cos(60°)', a: '1/2' },
  ];
  const idx = Math.abs(getRandomInt(0, questions.length - 1, rng)) % questions.length;
  const item = questions[idx] || questions[0]!;
  return {
    question: `${item.q} 값 = ?`,
    answer: item.a,
    inputType: typeof item.a === 'number' ? 'number' : 'fraction',
  };
}
