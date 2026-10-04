/**
 * [Climb Path Utils]
 * 산악 등반 맵의 SVG 곡선 경로 및 노드 좌표를 산출하는 순수 수학 유틸리티 함수 모음입니다.
 * (객체 체조 원칙: 100% Zero-Else, 순수 함수 분리)
 */

export interface ClimbPoint {
  x: number;
  y: number;
}

export interface ClimbLevelData {
  id: number;
  status: 'locked' | 'current' | 'cleared';
  position: ClimbPoint;
}

export interface ClimbPathCalculationParams {
  totalLevels: number;
  levels: Array<{ level: number; name?: string; description?: string }>;
  fixedMaxLevels: number;
  nodeSpacing: number;
  listDistance: number;
  svgWidth: number;
  world: string;
  category: string;
  nextLevel: number;
  isAdmin: boolean;
  isLevelCleared: (world: string, category: string, levelId: number) => boolean;
}

export interface ClimbPathCalculationResult {
  levelData: ClimbLevelData[];
  pathPoints: ClimbPoint[];
  svgHeight: number;
  lastClearedIndex: number;
}

/**
 * 스테이지 표지판(Signpost)의 좌/우 배치 방향을 결정합니다. (Zero-Else)
 */
export function calculateSignpostPlacement(posX: number, stageId: string): boolean {
  const ESTIMATED_BADGE_WIDTH = 110;
  const badgeSpacing = 42;
  const leftPlacementX = posX - ESTIMATED_BADGE_WIDTH - badgeSpacing;
  const rightPlacementX = posX + badgeSpacing;

  if (leftPlacementX < 10) return false;
  if (rightPlacementX + ESTIMATED_BADGE_WIDTH > 390) return true;
  return stageId === 'basic' || stageId === 'focus';
}

/**
 * 레벨 클리어 여부 및 현재 활성 레벨에 기반하여 노드 상태를 결정합니다. (Zero-Else)
 */
export function determineLevelStatus(
  isCleared: boolean,
  isCurrentOrAdmin: boolean
): 'locked' | 'current' | 'cleared' {
  if (isCleared) return 'cleared';
  if (isCurrentOrAdmin) return 'current';
  return 'locked';
}

/**
 * 점들의 배열을 바탕으로 부드러운 2차 베지어 곡선(Quadratic Bezier) SVG Path 데이터를 생성합니다.
 */
export function createSvgSmoothPath(points: ClimbPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) continue;

    const cpX = (prev.x + curr.x) / 2;
    const cpY = (prev.y + curr.y) / 2;
    path += ` Q ${cpX} ${cpY}, ${curr.x} ${curr.y}`;
  }
  return path;
}

/**
 * 활성 노드 또는 클리어된 최상단 노드를 판별하여 스크롤 목표 레벨 ID를 산출합니다. (Zero-Else)
 */
export function determineTargetLevelId(levelData: ClimbLevelData[]): number {
  const currentLevel = levelData.find((l) => l.status === 'current');
  if (currentLevel) return currentLevel.id;

  const clearedLevels = levelData.filter((l) => l.status === 'cleared');
  if (clearedLevels.length > 0) {
    return clearedLevels[clearedLevels.length - 1].id;
  }

  return levelData[0]?.id ?? 1;
}

/**
 * 전체 레벨 메타데이터와 맵 레이아웃 규격을 바탕으로 모든 노드 좌표 및 SVG 높이를 계산합니다.
 */
export function calculateClimbPoints(
  params: ClimbPathCalculationParams
): ClimbPathCalculationResult {
  const {
    totalLevels,
    levels,
    fixedMaxLevels,
    nodeSpacing,
    listDistance,
    svgWidth,
    world,
    category,
    nextLevel,
    isAdmin,
    isLevelCleared,
  } = params;

  const data: ClimbLevelData[] = [];
  const points: ClimbPoint[] = [];
  let lastClearedIdx = -1;

  const lastNodeY = listDistance;
  const firstNodeY = lastNodeY + (fixedMaxLevels - 1) * nodeSpacing;
  const calculatedSvgHeight = firstNodeY + 100;
  const centerX = svgWidth * 0.5;
  const amplitude = svgWidth * 0.3;
  const FREQUENCY_PER_LEVELS = 15; // 15레벨마다 S자 곡선 1회 반복

  for (let i = 0; i < totalLevels; i++) {
    const y = firstNodeY - i * nodeSpacing; // 레벨 1은 하단, 상위 레벨로 갈수록 Y 감소
    const offsetX = Math.sin((i / FREQUENCY_PER_LEVELS) * Math.PI * 2) * amplitude;
    const x = centerX + offsetX;

    points.push({ x, y });

    const levelObj = levels[i];
    if (!levelObj) continue;
    const levelId = levelObj.level;
    if (levelId === undefined) continue;

    const isCleared = isLevelCleared(world, category, levelId);
    const isCurrentOrAdmin = levelId === nextLevel || (isAdmin && !isCleared);
    const status = determineLevelStatus(isCleared, isCurrentOrAdmin);

    if (status === 'cleared') {
      lastClearedIdx = i;
    }

    data.push({
      id: levelId,
      status,
      position: { x, y },
    });
  }

  return {
    levelData: data,
    pathPoints: points,
    svgHeight: calculatedSvgHeight,
    lastClearedIndex: lastClearedIdx,
  };
}
