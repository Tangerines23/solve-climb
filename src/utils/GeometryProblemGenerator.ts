import { Difficulty } from '../types/quiz';

export interface GeometryProblem {
  question: string;
  answer: number | string;
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
  if (level > 10) {
    const randomVal = rng ? rng.randomInt(1, 5) : Math.floor(Math.random() * 5) + 1;
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
      default:
        return generateSolidVolume(rng);
    }
  }

  switch (level) {
    case 1:
      return generateBasicShapes(rng);
    case 2:
      return generateTriangleProperties(rng);
    case 3:
      return generateQuadrilateralProperties(rng);
    case 4:
      return generateAreaRect(rng);
    case 5:
      return generateAreaTriangle(rng);
    case 6:
      return generateCircleBasic(rng);
    case 7:
      return generateCircleAdvanced(rng);
    case 8:
      return generateSolidBasic(rng);
    case 9:
      return generateSymmetry(rng);
    case 10:
      return generatePythagorean(rng);
    default:
      return generateBasicShapes(rng);
  }
}

function generateBasicShapes(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const shapes = [
    { name: '삼각형', vertices: 3 },
    { name: '사각형', vertices: 4 },
    { name: '오각형', vertices: 5 },
    { name: '육각형', vertices: 6 },
  ];
  const shape = shapes[getRandomInt(0, shapes.length - 1, rng)];
  return {
    question: `${shape.name}의 꼭짓점 개수는?`,
    answer: shape.vertices,
  };
}

function generateTriangleProperties(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const types = [
    { name: '정삼각형', angle: 60 },
    { name: '직각삼각형', angle: 90 },
  ];
  const type = types[getRandomInt(0, types.length - 1, rng)];
  if (type.name === '정삼각형') {
    return { question: '정삼각형의 한 내각의 크기는? (도)', answer: 60 };
  } else {
    const a = getRandomInt(30, 60, rng);
    const b = 90 - a;
    return { question: `직각삼각형의 한 예각이 ${a}도일 때, 다른 예각은?`, answer: b };
  }
}

function generateQuadrilateralProperties(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const questions = [
    { q: '사각형의 내각의 합은? (도)', a: 360 },
    { q: '평행사변형에서 마주보는 두 각의 크기는 서로 같습니까? (1: 예, 2: 아니오)', a: 1 },
    { q: '마름모의 네 변의 길이는 모두 같습니까? (1: 예, 2: 아니오)', a: 1 },
  ];
  const item = questions[getRandomInt(0, questions.length - 1, rng)];
  return { question: item.q, answer: item.a };
}

function generateAreaRect(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const w = getRandomInt(2, 12, rng);
  const h = getRandomInt(2, 12, rng);
  return {
    question: `가로 ${w}, 세로 ${h}인 직사각형의 넓이는?`,
    answer: w * h,
  };
}

function generateAreaTriangle(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const b = getRandomInt(2, 10, rng) * 2; // Ensure even for integer result
  const h = getRandomInt(2, 10, rng);
  return {
    question: `밑변 ${b}, 높이 ${h}인 삼각형의 넓이는?`,
    answer: (b * h) / 2,
  };
}

function generateCircleBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const r = getRandomInt(2, 15, rng);
  return {
    question: `반지름이 ${r}인 원의 지름은?`,
    answer: r * 2,
  };
}

function generateCircleAdvanced(rng?: {
  random: () => number;
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const r = getRandomInt(1, 10, rng);
  const randomVal = rng ? rng.random() : Math.random();
  const type = randomVal > 0.5 ? '둘레' : '넓이';

  // Use pi = 3 for World 1/2 mental math
  if (type === '둘레') {
    return { question: `반지름이 ${r}인 원의 둘레는? (원주율=3)`, answer: 2 * 3 * r };
  } else {
    return { question: `반지름이 ${r}인 원의 넓이는? (원주율=3)`, answer: 3 * r * r };
  }
}

function generateSolidBasic(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const solids = [
    { name: '정육면체', faces: 6 },
    { name: '사각뿔', faces: 5 },
    { name: '삼각기둥', faces: 5 },
  ];
  const solid = solids[getRandomInt(0, solids.length - 1, rng)];
  return {
    question: `${solid.name}의 면의 개수는?`,
    answer: solid.faces,
  };
}

function generateSymmetry(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const questions = [
    { q: '정사각형의 대칭축은 몇 개인가?', a: 4 },
    { q: '원(Circle)의 대칭축은 몇 개인가? (999: 무수히 많음)', a: 999 },
    { q: '정삼각형의 대칭축은 몇 개인가?', a: 3 },
  ];
  const item = questions[getRandomInt(0, questions.length - 1, rng)];
  return { question: item.q, answer: item.a };
}

function generatePythagorean(rng?: {
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
      question: `직각삼각형의 두 변이 ${triple.a}, ${triple.b}일 때 빗변의 길이는?`,
      answer: triple.c,
    };
  } else {
    return {
      question: `직각삼각형의 빗변이 ${triple.c}, 한 변이 ${triple.a}일 때 다른 변의 길이는?`,
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
    return {
      question: `반지름이 ${r}, 높이가 ${h}인 원기둥의 부피는? (원주율=3)`,
      answer: 3 * r * r * h,
    };
  } else {
    const w = getRandomInt(2, 8, rng);
    const d = getRandomInt(2, 8, rng);
    const h = getRandomInt(3, 10, rng);
    return {
      question: `가로 ${w}, 세로 ${d}, 높이 ${h}인 직육면체의 부피는?`,
      answer: w * d * h,
    };
  }
}

function generateSolidSurfaceArea(rng?: {
  randomInt: (min: number, max: number) => number;
}): GeometryProblem {
  const s = getRandomInt(2, 10, rng);
  return {
    question: `모서리의 길이가 ${s}인 정육면체의 겉넓이는?`,
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
    question: `점 (${x1}, ${y1})과 (${x2}, ${y2}) 사이의 거리는?`,
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
  const item = questions[getRandomInt(0, questions.length - 1, rng)];
  return {
    question: `${item.q} 의 값은?`,
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
  const t = triples[getRandomInt(0, triples.length - 1, rng)];
  return {
    question: `직각삼각형의 두 변이 ${t.a}, ${t.b}일 때, 빗변의 길이는?`,
    answer: t.c,
  };
}
