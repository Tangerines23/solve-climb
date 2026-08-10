export interface Point {
  x: number;
  y: number;
}

/**
 * 피봇(pivot)을 중심으로 특정 각도(angleRad)만큼 2D 회전시킨 새 좌표 반환
 */
export function rotatePointAroundPivot(
  target: Point,
  pivot: Point,
  centerPrime: Point,
  angleRad: number
): Point {
  const relX = target.x - pivot.x;
  const relY = target.y - pivot.y;
  const rx = relX * Math.cos(angleRad) - relY * Math.sin(angleRad);
  const ry = relX * Math.sin(angleRad) + relY * Math.cos(angleRad);
  return {
    x: centerPrime.x + rx,
    y: centerPrime.y + ry,
  };
}

/**
 * Point 배열을 SVG polygon `points` 문자열(ex: "10,20 30,40 50,60")로 변환
 */
export function pointsToSvgString(points: Point[], precision = 1): string {
  return points.map((pt) => `${pt.x.toFixed(precision)},${pt.y.toFixed(precision)}`).join(' ');
}

/**
 * 선형 보간 (Linear Interpolation)
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
