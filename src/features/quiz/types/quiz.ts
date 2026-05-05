// 01Math Game Master Plan에 따른 구조 정의

// 1. 산 (Mountain) - 최상위 레벨
export type Mountain = 'math' | 'language' | 'logic' | 'general';

// 2. 분야 (Category) - 산 내부의 분야 (기초, 논리, 대수, 심화 + 언어 분야)
export type Category = '기초' | '논리' | '대수' | '심화' | '히라가나' | '가타카나' | '어휘';

// 3. 테마 (World) - 분야 내부의 테마
export type World = 'World1' | 'World2' | 'World3' | 'World4' | 'LangWorld1';

// 호환성을 위한 기존 타입 별칭
export type LanguageType = '한글' | '일본어' | '영어';
export type LanguageSubTopic = '문자' | '어휘' | '회화' | '문법';

// 월드별 고유 ID 조합 타입
export type Topic = `${World}-${Category}`;

export interface MathProblem {
  expression: string;
  answer: number | string;
  displayExpression?: string;
  inputType?: 'number' | 'decimal' | 'fraction';
}

export interface QuizQuestion {
  id?: string;
  question: string;
  answer: number | string;
  options?: (number | string)[];
  level?: number;
  category?: Category;
  inputType?: 'number' | 'decimal' | 'fraction' | 'coordinate';
  hintType?: 'transposition' | 'coordinate' | 'calculus' | 'function-machine' | 'integral-tank';
  hintData?: FunctionMachineHint | IntegralTankHint | CalculusHint | Record<string, unknown>;
}

export interface FunctionMachineHint {
  type: 'plus' | 'square';
  value: number;
  input: number;
}

export interface IntegralTankHint {
  type: 'power' | 'simple';
  coeff?: number;
  power?: number;
  value?: number;
  x: number;
}

export interface CalculusHint {
  type: 'limit' | 'derivative';
  func: string;
}

// 게임 모드 타입
export type GameMode = 'time-attack' | 'survival' | 'base-camp' | 'base-camp-result' | 'infinite';

// 난이도 타입
export type Difficulty = 'easy' | 'medium' | 'hard';

// 학습/게임 티어 (현재의 난이도 체계)
export type Tier = 'normal' | 'hard';

// 시간 제한 타입 (초 단위)
export type TimeLimit = 10 | 15 | 60 | 120 | 180; // 10s/15s(Revive), 1min, 2min, 3min

/**
 * 오답 정보 인터페이스
 */
export interface WrongAnswer {
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
}
