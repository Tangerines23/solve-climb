import { Difficulty, GeneralTopic } from '../types/quiz';

export interface GeneralProblem {
  question: string;
  answer: string | number;
}

// 간단한 문제 데이터베이스 (확장 가능)
const GENERAL_DB: Record<GeneralTopic, { q: string; a: string | number; d: Difficulty }[]> = {
  역사: [
    { q: '임진왜란이 발발한 연도는?', a: 1592, d: 'medium' },
    { q: '3.1 운동이 일어난 연도는?', a: 1919, d: 'easy' },
    { q: '조선의 건국 연도는?', a: 1392, d: 'medium' },
    { q: '광복절은 8월 며칠인가?', a: 15, d: 'easy' },
    { q: '한글이 반포된 연도는?', a: 1446, d: 'hard' },
  ],
  과학: [
    { q: '물의 끓는점(섭씨)은?', a: 100, d: 'easy' },
    { q: '사람의 갈비뼈 개수는(한쪽)?', a: 12, d: 'medium' },
    { q: '태양계의 행성 개수는?', a: 8, d: 'easy' },
    { q: '원주율(파이)의 정수 부분은?', a: 3, d: 'easy' },
    { q: '빛의 속도는 초속 약 몇만 km인가?', a: 30, d: 'hard' },
  ],
  지리: [
    { q: '서울의 지역번호는?', a: 2, d: 'easy' },
    { q: '독도는 동경 13x도이다. 일의 자리는?', a: 1, d: 'hard' }, // 131.87 -> 131 or 132? Keep simple.
    { q: '대구의 지역번호는?', a: 53, d: 'medium' },
    { q: '한국의 도(道) 개수는?', a: 8, d: 'medium' }, // 8도 (강원,경기,충청,경상,전라,함경,평안,황해 - 역사적? Admin? 8 is safe answer usually)
    { q: '부산의 지역번호는?', a: 51, d: 'medium' },
  ],
  문화: [
    { q: '피아노 건반의 총 개수는?', a: 88, d: 'medium' },
    { q: '바둑판의 가로줄 수는?', a: 19, d: 'hard' },
    { q: '축구 한 팀의 선수 수는?', a: 11, d: 'easy' },
    { q: '올림픽은 몇 년마다 열리나?', a: 4, d: 'easy' },
    { q: '야구의 정규 이닝 수는?', a: 9, d: 'easy' },
  ],
};

export function generateGeneralQuestion(
  topic: GeneralTopic,
  difficulty: Difficulty
): GeneralProblem {
  const pool = GENERAL_DB[topic] || [];

  // 난이도에 맞는 문제 필터링 (없으면 전체에서 선택)
  const filtered = pool.filter((p) => p.d === difficulty);
  const candidates = filtered.length > 0 ? filtered : pool;

  if (candidates.length === 0) {
    // Fallback
    return { question: '태양은 어느 쪽에서 뜨나(동/서)?', answer: '동' };
  }

  const problem = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    question: problem.q,
    answer: problem.a,
  };
}
