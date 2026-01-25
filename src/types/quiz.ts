// 01Math Game Master Plan에 따른 구조 정의

// 1. 산 (Mountain) - 최상위 레벨
export type Mountain = 'math' | 'language' | 'logic' | 'general';

// 2. 분야 (Category) - 산 내부의 분야 (기초, 논리, 대수, 심화 + 언어 분야)
export type Category = '기초' | '논리' | '대수' | '심화' | '히라가나' | '가타카나' | '어휘';

// 3. 테마 (World) - 분야 내부의 테마
export type World = 'World1' | 'World2' | 'World3' | 'World4' | 'LangWorld1';

// 호환성을 위한 기존 타입 별칭
export type MathTopic = '덧셈' | '뺄셈' | '곱셈' | '나눗셈';
export type LanguageType = '한글' | '일본어' | '영어';
export type LanguageSubTopic = '문자' | '어휘' | '회화' | '문법';
export type LanguageTopic = `${LanguageType}-${LanguageSubTopic}`;
export type LogicTopic = '추론' | '퍼즐' | '패턴' | '공간';
export type GeneralTopic = '역사' | '과학' | '지리' | '문화';

// 월드별 고유 ID 조합 타입
export type Topic = `${World}-${Category}`;

export interface CategoryTopic {
  category: Category;
  world: World;
}

export interface QuizQuestion {
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
