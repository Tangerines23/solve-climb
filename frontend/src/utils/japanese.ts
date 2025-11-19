// 일본어 히라가나-로마지 매핑 데이터

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
  { hiragana: 'と', romaji: 'to' },
  
  // N행
  { hiragana: 'な', romaji: 'na' },
  { hiragana: 'に', romaji: 'ni' },
  { hiragana: 'ぬ', romaji: 'nu' },
  { hiragana: 'ね', romaji: 'ne' },
  { hiragana: 'の', romaji: 'no' },
  
  // H행
  { hiragana: 'は', romaji: 'ha' },
  { hiragana: 'ひ', romaji: 'hi' },
  { hiragana: 'ふ', romaji: 'fu' },
  { hiragana: 'へ', romaji: 'he' },
  { hiragana: 'ほ', romaji: 'ho' },
  
  // M행
  { hiragana: 'ま', romaji: 'ma' },
  { hiragana: 'み', romaji: 'mi' },
  { hiragana: 'む', romaji: 'mu' },
  { hiragana: 'め', romaji: 'me' },
  { hiragana: 'も', romaji: 'mo' },
  
  // Y행
  { hiragana: 'や', romaji: 'ya' },
  { hiragana: 'ゆ', romaji: 'yu' },
  { hiragana: 'よ', romaji: 'yo' },
  
  // R행
  { hiragana: 'ら', romaji: 'ra' },
  { hiragana: 'り', romaji: 'ri' },
  { hiragana: 'る', romaji: 'ru' },
  { hiragana: 'れ', romaji: 're' },
  { hiragana: 'ろ', romaji: 'ro' },
  
  // W행
  { hiragana: 'わ', romaji: 'wa' },
  { hiragana: 'を', romaji: 'wo' },
  { hiragana: 'ん', romaji: 'n' },
  
  // 탁음 (濁音)
  { hiragana: 'が', romaji: 'ga' },
  { hiragana: 'ぎ', romaji: 'gi' },
  { hiragana: 'ぐ', romaji: 'gu' },
  { hiragana: 'げ', romaji: 'ge' },
  { hiragana: 'ご', romaji: 'go' },
  { hiragana: 'ざ', romaji: 'za' },
  { hiragana: 'じ', romaji: 'ji' },
  { hiragana: 'ず', romaji: 'zu' },
  { hiragana: 'ぜ', romaji: 'ze' },
  { hiragana: 'ぞ', romaji: 'zo' },
  { hiragana: 'だ', romaji: 'da' },
  { hiragana: 'ぢ', romaji: 'ji' },
  { hiragana: 'づ', romaji: 'zu' },
  { hiragana: 'で', romaji: 'de' },
  { hiragana: 'ど', romaji: 'do' },
  { hiragana: 'ば', romaji: 'ba' },
  { hiragana: 'び', romaji: 'bi' },
  { hiragana: 'ぶ', romaji: 'bu' },
  { hiragana: 'べ', romaji: 'be' },
  { hiragana: 'ぼ', romaji: 'bo' },
  
  // 반탁음 (半濁音)
  { hiragana: 'ぱ', romaji: 'pa' },
  { hiragana: 'ぴ', romaji: 'pi' },
  { hiragana: 'ぷ', romaji: 'pu' },
  { hiragana: 'ぺ', romaji: 'pe' },
  { hiragana: 'ぽ', romaji: 'po' },
];

/**
 * 랜덤 히라가나 문제 생성
 */
export function generateJapaneseQuestion(difficulty: 'easy' | 'medium' | 'hard'): {
  hiragana: string;
  romaji: string;
} {
  // 난이도에 따라 사용할 히라가나 범위 조정
  let availableMappings: HiraganaMapping[];
  
  switch (difficulty) {
    case 'easy':
      // 기본 모음 + K, S, T, N, H, M행만 (기초)
      availableMappings = HIRAGANA_MAPPINGS.filter(m => {
        const firstChar = m.hiragana[0];
        return ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 
                'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と',
                'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ',
                'ま', 'み', 'む', 'め', 'も'].includes(firstChar);
      });
      break;
    case 'medium':
      // 기본 히가라나 46자 (Y, R, W행 포함)
      availableMappings = HIRAGANA_MAPPINGS.filter(m => {
        const romaji = m.romaji;
        return romaji.length <= 2; // 기본 문자만 (요음 제외)
      });
      break;
    case 'hard':
      // 모든 히라가나 (탁음, 반탁음 포함)
      availableMappings = HIRAGANA_MAPPINGS;
      break;
    default:
      availableMappings = HIRAGANA_MAPPINGS;
  }
  
  // 랜덤으로 하나 선택
  const randomIndex = Math.floor(Math.random() * availableMappings.length);
  const selected = availableMappings[randomIndex];
  
  return {
    hiragana: selected.hiragana,
    romaji: selected.romaji,
  };
}

/**
 * 로마지 답안 정규화 (대소문자, 공백 무시)
 */
export function normalizeRomaji(input: string): string {
  return input.toLowerCase().trim();
}

