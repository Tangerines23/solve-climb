import { safeAccess } from '../../utils/validation';

export interface Point2D {
  x: number;
  y: number;
}

export function computeRegularVertices(
  n: number,
  size: number = 200,
  radius: number = 56
): Point2D[] {
  const vertices: Point2D[] = [];
  const centerX = size / 2;
  const centerY = size / 2;
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    vertices.push({ x, y });
  }
  return vertices;
}

function pickSplitPoint(
  i: number,
  splitVertexIdx: number,
  cornerPt: Point2D,
  startBase: Point2D[]
): Point2D {
  if (i <= splitVertexIdx) {
    return startBase.at(i) ?? startBase[startBase.length - 1]!;
  }
  if (i === splitVertexIdx + 1) {
    return cornerPt;
  }
  const srcIdx = (i - 1) % startBase.length;
  return startBase.at(srcIdx) ?? startBase[0]!;
}

export function computeMorphedPolygonVertices(
  currSides: number,
  prevSides: number,
  progress: number,
  precomputedVertices: Record<number, Point2D[]>,
  fallbackSides: number = 3
): Point2D[] {
  const targetBase =
    (safeAccess(precomputedVertices, currSides) as Point2D[] | undefined) ??
    (safeAccess(precomputedVertices, fallbackSides) as Point2D[] | undefined) ??
    computeRegularVertices(currSides);

  if (progress >= 1 || prevSides === currSides) {
    return targetBase;
  }

  if (currSides > prevSides) {
    const startBase =
      (safeAccess(precomputedVertices, prevSides) as Point2D[] | undefined) ??
      (safeAccess(precomputedVertices, fallbackSides) as Point2D[] | undefined) ??
      computeRegularVertices(prevSides);

    const splitVertexIdx = prevSides === 4 ? 1 : Math.floor(prevSides / 2);
    const cornerPt = startBase.at(splitVertexIdx % startBase.length) ?? startBase[0]!;

    const initialPoints = Array.from({ length: currSides }, (_, i) =>
      pickSplitPoint(i, splitVertexIdx, cornerPt, startBase)
    );

    return targetBase.map((target, i) => {
      const start = initialPoints.at(i) ?? startBase[0] ?? target;
      return {
        x: start.x + (target.x - start.x) * progress,
        y: start.y + (target.y - start.y) * progress,
      };
    });
  }

  const startSides = currSides;
  const targetSides = prevSides;

  const startBase =
    (safeAccess(precomputedVertices, startSides) as Point2D[] | undefined) ??
    (safeAccess(precomputedVertices, 3) as Point2D[] | undefined) ??
    computeRegularVertices(startSides);

  const revTargetBase =
    (safeAccess(precomputedVertices, targetSides) as Point2D[] | undefined) ??
    (safeAccess(precomputedVertices, 4) as Point2D[] | undefined) ??
    computeRegularVertices(targetSides);

  const splitVertexIdx = startSides === 4 ? 1 : Math.floor(startSides / 2);
  const cornerPt = startBase.at(splitVertexIdx % startBase.length) ?? startBase[0]!;

  const initialPoints = Array.from({ length: targetSides }, (_, i) =>
    pickSplitPoint(i, splitVertexIdx, cornerPt, startBase)
  );

  const revU = 1 - progress;
  return revTargetBase.map((target, i) => {
    const start = initialPoints.at(i) ?? startBase[0] ?? target;
    return {
      x: start.x + (target.x - start.x) * revU,
      y: start.y + (target.y - start.y) * revU,
    };
  });
}

export function computeTriangleRoundedAngles(
  v0: Point2D,
  v1: Point2D,
  v2: Point2D
): {
  alphaDeg: number;
  betaDeg: number;
  gammaDeg: number;
} {
  const a = Math.hypot(v2.x - v1.x, v2.y - v1.y);
  const b = Math.hypot(v2.x - v0.x, v2.y - v0.y);
  const c = Math.hypot(v1.x - v0.x, v1.y - v0.y);

  const cosA = Math.max(-1, Math.min(1, (b ** 2 + c ** 2 - a ** 2) / (2 * b * c)));
  const cosB = Math.max(-1, Math.min(1, (a ** 2 + c ** 2 - b ** 2) / (2 * a * c)));
  const cosC = Math.max(-1, Math.min(1, (a ** 2 + b ** 2 - c ** 2) / (2 * a * b)));

  const exactA = Math.acos(cosA) * (180 / Math.PI);
  const exactB = Math.acos(cosB) * (180 / Math.PI);
  const exactC = Math.acos(cosC) * (180 / Math.PI);

  if (Math.abs(exactB - exactC) < 1.0) {
    const equalBase = Math.round((exactB + exactC) / 2);
    return {
      alphaDeg: 180 - equalBase * 2,
      betaDeg: equalBase,
      gammaDeg: equalBase,
    };
  }

  if (Math.abs(exactA - exactB) < 1.0) {
    const equalSide = Math.round((exactA + exactB) / 2);
    return {
      alphaDeg: equalSide,
      betaDeg: equalSide,
      gammaDeg: 180 - equalSide * 2,
    };
  }

  const roundedA = Math.round(exactA);
  const roundedB = Math.round(exactB);
  const roundedC = Math.round(exactC);

  if (roundedA + roundedB + roundedC === 180) {
    return { alphaDeg: roundedA, betaDeg: roundedB, gammaDeg: roundedC };
  }

  const errA = Math.abs(exactA - roundedA);
  const errB = Math.abs(exactB - roundedB);
  const errC = Math.abs(exactC - roundedC);

  if (errC >= errA && errC >= errB) {
    return {
      alphaDeg: roundedA,
      betaDeg: roundedB,
      gammaDeg: 180 - roundedA - roundedB,
    };
  }

  if (errB >= errA && errB >= errC) {
    return {
      alphaDeg: roundedA,
      betaDeg: 180 - roundedA - roundedC,
      gammaDeg: roundedC,
    };
  }

  return {
    alphaDeg: 180 - roundedB - roundedC,
    betaDeg: roundedB,
    gammaDeg: roundedC,
  };
}
