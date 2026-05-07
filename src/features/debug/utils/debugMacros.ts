/**
 * 디버그 매크로 시스템
 * 복잡한 테스트 시나리오를 버튼 하나로 실행할 수 있게 합니다.
 */

export interface MacroStep {
  type: 'navigate' | 'setResource' | 'wait' | 'applyPreset' | 'log';
  // navigate
  path?: string;
  // setResource
  resource?: 'stamina' | 'minerals';
  value?: number;
  // wait
  ms?: number;
  // applyPreset
  presetId?: string;
  // log
  message?: string;
}

export interface DebugMacro {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: MacroStep[];
}

/**
 * 기본 제공 매크로 목록
 */
export const builtInMacros: DebugMacro[] = [
  {
    id: 'quick-quiz',
    name: '퀴즈 빠른 진입',
    description: '홈 → 카테고리 → 레벨 → 퀴즈까지 자동 이동',
    icon: '🚀',
    steps: [
      { type: 'navigate', path: '/' },
      { type: 'wait', ms: 300 },
      // Top level: Mountain Select (implicitly handled by going to category-select with mountain param)
      { type: 'navigate', path: '/category-select?mountain=math' },
      { type: 'wait', ms: 300 },
      // Level Select with fully qualified params
      { type: 'navigate', path: '/level-select?mountain=math&world=World1&category=기초' },
      { type: 'wait', ms: 300 },
      // Quiz Entry
      { type: 'navigate', path: '/quiz?mountain=math&world=World1&category=기초&level=1' },
      { type: 'log', message: '퀴즈 페이지 도달 완료' },
    ],
  },
  {
    id: 'low-stamina',
    name: '스태미나 부족 상황',
    description: '스태미나를 0으로 설정하고 퀴즈 진입 테스트',
    icon: '⚡',
    steps: [
      { type: 'setResource', resource: 'stamina', value: 0 },
      { type: 'wait', ms: 100 },
      { type: 'navigate', path: '/quiz?mountain=math&world=World1&category=기초&level=1' },
      { type: 'log', message: '스태미나 0 상태에서 퀴즈 진입 시도' },
    ],
  },
  {
    id: 'rich-user',
    name: '부자 유저 상태',
    description: '스태미나 999, 미네랄 99999로 설정',
    icon: '💰',
    steps: [
      { type: 'setResource', resource: 'stamina', value: 999 },
      { type: 'setResource', resource: 'minerals', value: 99999 },
      { type: 'log', message: '리소스 최대치 설정 완료' },
    ],
  },
  {
    id: 'new-user',
    name: '신규 유저 시뮬레이션',
    description: '스태미나 5, 미네랄 0으로 초기화',
    icon: '👶',
    steps: [
      { type: 'setResource', resource: 'stamina', value: 5 },
      { type: 'setResource', resource: 'minerals', value: 0 },
      { type: 'navigate', path: '/' },
      { type: 'log', message: '신규 유저 상태 설정 완료' },
    ],
  },
  {
    id: 'shop-test',
    name: '상점 테스트',
    description: '미네랄을 설정하고 상점으로 이동',
    icon: '🛒',
    steps: [
      { type: 'setResource', resource: 'minerals', value: 5000 },
      { type: 'wait', ms: 100 },
      { type: 'navigate', path: '/shop' },
      { type: 'log', message: '상점 테스트 준비 완료' },
    ],
  },
];

/**
 * 매크로 실행 결과
 */
export interface MacroExecutionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  error?: string;
}

/**
 * 매크로 실행 함수
 */
export async function executeMacro(
  macro: DebugMacro,
  navigate: (path: string) => void,
  setStamina: (value: number) => Promise<void>,
  setMinerals: (value: number) => Promise<void>,
  onProgress?: (step: number, total: number) => void
): Promise<MacroExecutionResult> {
  const result: MacroExecutionResult = {
    success: false,
    completedSteps: 0,
    totalSteps: macro.steps.length,
  };

  try {
    for (let i = 0; i < macro.steps.length; i++) {
      const step = macro.steps.at(i);
      if (!step) continue;
      onProgress?.(i + 1, macro.steps.length);

      switch (step.type) {
        case 'navigate':
          if (step.path) {
            navigate(step.path);
          }
          break;

        case 'setResource':
          if (step.resource === 'stamina' && step.value !== undefined) {
            await setStamina(step.value);
          } else if (step.resource === 'minerals' && step.value !== undefined) {
            await setMinerals(step.value);
          }
          break;

        case 'wait':
          if (step.ms) {
            await new Promise((resolve) => setTimeout(resolve, step.ms));
          }
          break;

        case 'log':
          if (step.message) {
            console.log(`[Macro: ${macro.name}]`, step.message);
          }
          break;

        case 'applyPreset':
          // 프리셋 적용은 추후 구현
          console.log(`[Macro] Preset ${step.presetId} 적용 (미구현)`);
          break;
      }

      result.completedSteps = i + 1;
    }

    result.success = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : '알 수 없는 오류';
  }

  return result;
}
