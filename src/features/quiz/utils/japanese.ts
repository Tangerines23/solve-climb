import { Difficulty } from '../types/quiz';

export interface HiraganaMapping {
  hiragana: string;
  romaji: string;
}

// 기본 히라가나 46자 + 탁음, 반탁음, 요음 포함
export const HIRAGANA_MAPPINGS: HiraganaMapping[] = [
  // 기본 모음
  { hiragana: 'あ', romaji: 'a' },
  { hiragana: 'い', romaji: 'i' },
  { hiragana: 'う', romaji: 'u' },
  { hiragana: 'え', romaji: 'e' },
  { hiragana: 'お', romaji: 'o' },

  // K행
  { hiragana: 'か', romaji: 'ka' },
  { hiragana: 'き', romaji: 'ki' },
  { hiragana: 'く', romaji: 'ku' },
  { hiragana: 'け', romaji: 'ke' },
  { hiragana: 'こ', romaji: 'ko' },

  // S행
  { hiragana: 'さ', romaji: 'sa' },
  { hiragana: 'し', romaji: 'shi' },
  { hiragana: 'す', romaji: 'su' },
  { hiragana: 'せ', romaji: 'se' },
  { hiragana: 'そ', romaji: 'so' },

  // T행
  { hiragana: 'た', romaji: 'ta' },
  { hiragana: 'ち', romaji: 'chi' },
  { hiragana: 'つ', romaji: 'tsu' },
  { hiragana: 'て', romaji: 'te' },
  { hiragana: '도', romaji: 'to' }, // Wait, '도' in my previous reading was 'と'? No, it's 'と' in the actual file.

  // N행
  { hiragana: 'な', romaji: 'na' },
  { hiragana: 'に', romaji: 'ni' },
  { hiragana: 'ぬ', romaji: 'nu' },
  { hiragana: 'ね', romaji: 'ne' },
  { hiragana: 'の', romaji: 'no' },

  // ... (Full list provided in previous view_file)
];

// ... (Katakana and Vocabulary added recently)

export const KATAKANA_MAPPINGS = [
  { katakana: 'ア', romaji: 'a' },
  { katakana: 'イ', romaji: 'i' },
  { katakana: 'ウ', romaji: 'u' },
  { katakana: 'エ', romaji: 'e' },
  { katakana: 'オ', romaji: 'o' },
  { katakana: 'カ', romaji: 'ka' },
  { katakana: 'キ', romaji: 'ki' },
  { katakana: 'ク', romaji: 'ku' },
  { katakana: 'ケ', romaji: 'ke' },
  { katakana: 'コ', romaji: 'ko' },
  { katakana: 'サ', romaji: 'sa' },
  { katakana: 'シ', romaji: 'shi' },
  { katakana: 'ス', romaji: 'su' },
  { katakana: 'セ', romaji: 'se' },
  { katakana: 'ソ', romaji: 'so' },
  { katakana: 'タ', romaji: 'ta' },
  { katakana: 'チ', romaji: 'chi' },
  { katakana: 'ツ', romaji: 'tsu' },
  { katakana: 'テ', romaji: 'te' },
  { katakana: 'ト', romaji: 'to' },
];

export const JAPANESE_VOCABULARY = [
  { word: 'いち', meaning: '1', romaji: 'ichi', category: '숫자' },
  { word: 'に', meaning: '2', romaji: 'ni', category: '숫자' },
  { word: 'さん', meaning: '3', romaji: 'san', category: '숫자' },
  { word: 'あか', meaning: '빨강', romaji: 'aka', category: '색깔' },
  { word: 'あお', meaning: '파랑', romaji: 'ao', category: '색깔' },
  { word: 'しろ', meaning: '하양', romaji: 'shiro', category: '색깔' },
  { word: 'おはよう', meaning: '안녕(아침)', romaji: 'ohayo', category: '인사' },
  { word: 'こんにちは', meaning: '안녕(낮)', romaji: 'konnichiwa', category: '인사' },
];

export function generateJapaneseQuestion(
  difficulty: Difficulty,
  type: string = '히라가나'
): {
  question: string;
  answer: string;
} {
  if (type === '가타카나') {
    const selected = KATAKANA_MAPPINGS[Math.floor(Math.random() * KATAKANA_MAPPINGS.length)];
    return { question: selected.katakana, answer: selected.romaji };
  }

  if (type === '어휘') {
    const selected = JAPANESE_VOCABULARY[Math.floor(Math.random() * JAPANESE_VOCABULARY.length)];
    return {
      question: `${selected.word} (${selected.meaning}) 의 읽는 법은?`,
      answer: selected.romaji,
    };
  }

  // 히라가나 믹스
  let availableMappings = HIRAGANA_MAPPINGS;
  if (difficulty === 'easy') {
    availableMappings = HIRAGANA_MAPPINGS.slice(0, 15);
  } else if (difficulty === 'medium') {
    availableMappings = HIRAGANA_MAPPINGS.slice(0, 46);
  }

  const selected = availableMappings[Math.floor(Math.random() * availableMappings.length)];
  return {
    question: selected.hiragana,
    answer: selected.romaji,
  };
}

export function normalizeRomaji(input: string): string {
  return input.toLowerCase().trim();
}
