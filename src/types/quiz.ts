// 카테고리와 분야 타입 정의
export type Category = '수학' | '언어' | '논리' | '상식';

// 수학 분야
export type MathTopic = '덧셈' | '뺄셈' | '곱셈' | '나눗셈';

// 언어 분야 - 언어별 세부 분야
export type LanguageType = '한글' | '일본어' | '영어';
export type LanguageSubTopic = '글자' | '문자' | '문장';
export type LanguageTopic = `${LanguageType}-${LanguageSubTopic}` | '맞춤법' | '어휘' | '속담';

// 논리 분야
export type LogicTopic = '수열' | '패턴' | '추론';

// 상식 분야
export type GeneralTopic = '역사' | '과학' | '지리' | '문화';

export type Topic = MathTopic | LanguageTopic | LogicTopic | GeneralTopic;

export interface CategoryTopic {
  category: Category;
  topic: Topic;
}

export interface QuizQuestion {
  question: string;
  answer: number | string;
  options?: (number | string)[];
}

// 게임 모드 타입
export type GameMode = 'time-attack' | 'survival';

// 난이도 타입
export type Difficulty = 'easy' | 'medium' | 'hard';

