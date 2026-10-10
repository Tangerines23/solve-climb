import { describe, it, expect } from 'vitest';
import {
  computeRegularVertices,
  computeMorphedPolygonVertices,
  computeTriangleRoundedAngles,
} from '../manimGeometryUtils';

describe('computeRegularVertices', () => {
  it('should return correct number of vertices for n=3,4,6', () => {
    expect(computeRegularVertices(3).length).toBe(3);
    expect(computeRegularVertices(4).length).toBe(4);
    expect(computeRegularVertices(6).length).toBe(6);
  });

  it('should return vertices at correct radius distance from center', () => {
    const vertices3 = computeRegularVertices(3, 200, 56);
    vertices3.forEach((vertex) => {
      const distance = Math.hypot(vertex.x - 100, vertex.y - 100);
      expect(distance).toBeCloseTo(56, 2);
    });

    const vertices4 = computeRegularVertices(4, 200, 56);
    vertices4.forEach((vertex) => {
      const distance = Math.hypot(vertex.x - 100, vertex.y - 100);
      expect(distance).toBeCloseTo(56, 2);
    });
  });
});

describe('computeMorphedPolygonVertices', () => {
  it('should return target vertices when progress >=1 or sides unchanged', () => {
    const precomputed: Record<number, Point2D[]> = {
      3: computeRegularVertices(3),
      4: computeRegularVertices(4),
    };

    expect(computeMorphedPolygonVertices(4, 4, 0.5, precomputed)).toEqual(precomputed[4]);

    expect(computeMorphedPolygonVertices(3, 3, 1.5, precomputed)).toEqual(precomputed[3]);
  });

  it('should interpolate forward morphing (3->4)', () => {
    const precomputed: Record<number, Point2D[]> = {
      3: computeRegularVertices(3),
      4: computeRegularVertices(4),
    };

    const initial = computeMorphedPolygonVertices(4, 3, 0, precomputed);
    expect(initial).toEqual(precomputed[3]);

    const mid = computeMorphedPolygonVertices(4, 3, 0.5, precomputed);
    mid.forEach((vertex, i) => {
      const start = precomputed[3][i];
      const target = precomputed[4][i];
      expect(vertex.x).toBeCloseTo(start.x + (target.x - start.x) * 0.5, 2);
      expect(vertex.y).toBeCloseTo(start.y + (target.y - start.y) * 0.5, 2);
    });
  });

  it('should interpolate reverse morphing (5->4)', () => {
    const precomputed: Record<number, Point2D[]> = {
      4: computeRegularVertices(4),
      5: computeRegularVertices(5),
    };

    const mid = computeMorphedPolygonVertices(4, 5, 0.5, precomputed);
    mid.forEach((vertex, i) => {
      const start = computeRegularVertices(5)[i];
      const target = computeRegularVertices(4)[i];
      expect(vertex.x).toBeCloseTo(start.x + (target.x - start.x) * 0.5, 2);
      expect(vertex.y).toBeCloseTo(start.y + (target.y - start.y) * 0.5, 2);
    });
  });
});

describe('computeTriangleRoundedAngles', () => {
  it('should return 60 degrees for equilateral triangle', () => {
    const result = computeTriangleRoundedAngles(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: Math.sqrt(3) / 2 }
    );
    expect(result.alphaDeg).toBe(60);
    expect(result.betaDeg).toBe(60);
    expect(result.gammaDeg).toBe(60);
  });

  it('should return correct angles for right isosceles triangle', () => {
    const result = computeTriangleRoundedAngles(
      { x: 100, y: 75 },
      { x: 35, y: 140 },
      { x: 165, y: 140 }
    );
    expect(result.alphaDeg).toBe(90);
    expect(result.betaDeg).toBe(45);
    expect(result.gammaDeg).toBe(45);
  });

  it('should ensure angles sum to exactly 180 degrees', () => {
    const v0 = { x: 0, y: 0 };
    const v1 = { x: 3, y: 0 };
    const v2 = { x: 1, y: 2 };

    const result = computeTriangleRoundedAngles(v0, v1, v2);
    expect(result.alphaDeg + result.betaDeg + result.gammaDeg).toBe(180);
  });
});
