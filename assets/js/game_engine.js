/**
 * 게임 엔진 - 문제 생성 로직
 * 카테고리/레벨별로 다양한 문제를 생성합니다.
 */

// 문제 ID 카운터
let problemIdCounter = 1;

/**
 * 언어/상식 문제 은행 데이터
 */
const GAME_DATA = {
  language: {
    voca: [
      { level: 1, q: "Apple", a: "사과", type: "choice", options: ["사과", "포도", "배", "귤"] },
      { level: 1, q: "Banana", a: "바나나", type: "choice", options: ["바나나", "오렌지", "딸기", "수박"] },
      { level: 1, q: "Cat", a: "고양이", type: "choice", options: ["고양이", "강아지", "토끼", "햄스터"] },
      { level: 2, q: "Dog", a: "강아지", type: "choice", options: ["강아지", "고양이", "새", "물고기"] },
      { level: 2, q: "Book", a: "책", type: "choice", options: ["책", "연필", "지우개", "공책"] },
    ],
    grammar: [
      { level: 1, q: "I ___ a boy.", a: "am", type: "choice", options: ["am", "is", "are", "be"] },
      { level: 1, q: "You ___ a student.", a: "are", type: "choice", options: ["am", "is", "are", "be"] },
      { level: 2, q: "He ___ playing soccer.", a: "is", type: "choice", options: ["am", "is", "are", "be"] },
      { level: 2, q: "They ___ friends.", a: "are", type: "choice", options: ["am", "is", "are", "be"] },
    ],
  },
  general: {
    history: [
      { level: 1, q: "한국의 수도는?", a: "서울", type: "choice", options: ["서울", "부산", "대구", "인천"] },
      { level: 1, q: "태극기는 몇 개의 괘로 이루어져 있나요?", a: "4", type: "choice", options: ["2", "3", "4", "5"] },
      { level: 2, q: "한국의 독립기념일은?", a: "8월 15일", type: "choice", options: ["3월 1일", "6월 6일", "8월 15일", "10월 3일"] },
    ],
    science: [
      { level: 1, q: "물의 화학식은?", a: "H2O", type: "choice", options: ["H2O", "CO2", "O2", "N2"] },
      { level: 1, q: "지구의 위성은?", a: "달", type: "choice", options: ["달", "화성", "금성", "목성"] },
      { level: 2, q: "태양계의 행성 개수는?", a: "8", type: "choice", options: ["7", "8", "9", "10"] },
    ],
  },
};

/**
 * 랜덤 숫자 생성 (min ~ max)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 배열에서 랜덤 요소 선택
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 수학 문제 생성 (알고리즘 기반)
 */
function generateMathProblem(sub, level) {
  let questionDisplay, answer, hint;

  // 레벨별 난이도 설정
  if (level === 1) {
    // 한 자릿수 연산 (1~9)
    const a = randomInt(1, 9);
    const b = randomInt(1, 9);
    
    if (sub === '덧셈' || sub === 'arithmetic') {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '덧셈 기초';
    } else if (sub === '뺄셈') {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      answer = max - min;
      questionDisplay = `${max} - ${min} = ?`;
      hint = '뺄셈 기초';
    } else if (sub === '곱셈') {
      answer = a * b;
      questionDisplay = `${a} × ${b} = ?`;
      hint = '곱셈 기초';
    } else if (sub === '나눗셈') {
      const divisor = randomInt(2, 9);
      const quotient = randomInt(1, 9);
      const dividend = divisor * quotient;
      answer = quotient;
      questionDisplay = `${dividend} ÷ ${divisor} = ?`;
      hint = '나눗셈 기초';
    } else {
      // 기본값: 덧셈
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '덧셈 기초';
    }
  } else if (level === 2) {
    // 합/차 20 이하
    const a = randomInt(1, 10);
    const b = randomInt(1, 10);
    
    if (sub === '덧셈' || sub === 'arithmetic') {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '덧셈 (합 20 이하)';
    } else if (sub === '뺄셈') {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      answer = max - min;
      questionDisplay = `${max} - ${min} = ?`;
      hint = '뺄셈 (차 20 이하)';
    } else {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '덧셈 (합 20 이하)';
    }
  } else if (level === 3) {
    // 간단한 곱셈 (구구단 2~5단) 또는 나눗셈
    if (sub === '곱셈' || sub === 'arithmetic') {
      const a = randomInt(2, 5);
      const b = randomInt(1, 9);
      answer = a * b;
      questionDisplay = `${a} × ${b} = ?`;
      hint = '구구단 (2~5단)';
    } else if (sub === '나눗셈') {
      const divisor = randomInt(2, 5);
      const quotient = randomInt(1, 9);
      const dividend = divisor * quotient;
      answer = quotient;
      questionDisplay = `${dividend} ÷ ${divisor} = ?`;
      hint = '나눗셈 (2~5단)';
    } else {
      // 기본값: 곱셈
      const a = randomInt(2, 5);
      const b = randomInt(1, 9);
      answer = a * b;
      questionDisplay = `${a} × ${b} = ?`;
      hint = '구구단 (2~5단)';
    }
  } else if (level === 4) {
    // 구구단 6~9단 또는 나눗셈
    if (sub === '곱셈' || sub === 'arithmetic') {
      const a = randomInt(6, 9);
      const b = randomInt(1, 9);
      answer = a * b;
      questionDisplay = `${a} × ${b} = ?`;
      hint = '구구단 (6~9단)';
    } else if (sub === '나눗셈') {
      const divisor = randomInt(6, 9);
      const quotient = randomInt(1, 9);
      const dividend = divisor * quotient;
      answer = quotient;
      questionDisplay = `${dividend} ÷ ${divisor} = ?`;
      hint = '나눗셈 (6~9단)';
    } else {
      // 기본값: 곱셈
      const a = randomInt(6, 9);
      const b = randomInt(1, 9);
      answer = a * b;
      questionDisplay = `${a} × ${b} = ?`;
      hint = '구구단 (6~9단)';
    }
  } else if (level === 5) {
    // 두 자릿수 덧셈/뺄셈 (받아올림 있음)
    const a = randomInt(10, 99);
    const b = randomInt(10, 99);
    
    if (sub === '덧셈' || sub === 'arithmetic') {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '두 자릿수 덧셈';
    } else if (sub === '뺄셈') {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      answer = max - min;
      questionDisplay = `${max} - ${min} = ?`;
      hint = '두 자릿수 뺄셈';
    } else {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '두 자릿수 덧셈';
    }
  } else if (level === 6) {
    // 두 자릿수 나눗셈 (나머지 0)
    const divisor = randomInt(2, 9);
    const quotient = randomInt(10, 99);
    const dividend = divisor * quotient;
    answer = quotient;
    questionDisplay = `${dividend} ÷ ${divisor} = ?`;
    hint = '두 자릿수 나눗셈';
  } else if (level === 7) {
    // 두 자릿수 × 한 자릿수
    const a = randomInt(10, 99);
    const b = randomInt(1, 9);
    answer = a * b;
    questionDisplay = `${a} × ${b} = ?`;
    hint = '두 자릿수 곱셈';
  } else if (level === 8) {
    // 두 자릿수 × 두 자릿수 (작은 수)
    const a = randomInt(10, 30);
    const b = randomInt(10, 30);
    answer = a * b;
    questionDisplay = `${a} × ${b} = ?`;
    hint = '두 자릿수 곱셈 (중급)';
  } else if (level === 9) {
    // 세 자릿수 덧셈/뺄셈
    const a = randomInt(100, 999);
    const b = randomInt(100, 999);
    
    if (sub === '덧셈' || sub === 'arithmetic') {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '세 자릿수 덧셈';
    } else if (sub === '뺄셈') {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      answer = max - min;
      questionDisplay = `${max} - ${min} = ?`;
      hint = '세 자릿수 뺄셈';
    } else {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '세 자릿수 덧셈';
    }
  } else if (level === 10) {
    // 세 자릿수 혼합 연산 (모든 연산 포함)
    const a = randomInt(100, 999);
    const b = randomInt(10, 99);
    const operations = ['+', '-', '×', '÷'];
    const operation = randomChoice(operations);
    
    if (operation === '+') {
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '세 자릿수 혼합 연산';
    } else if (operation === '-') {
      const max = Math.max(a, b);
      const min = Math.min(a, b);
      answer = max - min;
      questionDisplay = `${max} - ${min} = ?`;
      hint = '세 자릿수 혼합 연산';
    } else if (operation === '×') {
      const multiplier = randomInt(2, 9);
      const multiplicand = randomInt(100, 999);
      answer = multiplier * multiplicand;
      questionDisplay = `${multiplier} × ${multiplicand} = ?`;
      hint = '세 자릿수 혼합 연산';
    } else if (operation === '÷') {
      const divisor = randomInt(2, 9);
      const quotient = randomInt(100, 999);
      const dividend = divisor * quotient;
      answer = quotient;
      questionDisplay = `${dividend} ÷ ${divisor} = ?`;
      hint = '세 자릿수 혼합 연산';
    } else {
      // 기본값: 덧셈
      answer = a + b;
      questionDisplay = `${a} + ${b} = ?`;
      hint = '세 자릿수 혼합 연산';
    }
  } else {
    // 레벨이 1~10 범위를 벗어난 경우 기본값 (레벨 1과 동일)
    const a = randomInt(1, 9);
    const b = randomInt(1, 9);
    answer = a + b;
    questionDisplay = `${a} + ${b} = ?`;
    hint = '기본 연산';
  }

  return {
    id: problemIdCounter++,
    type: 'keypad',
    questionDisplay: questionDisplay,
    answer: String(answer),
    hint: hint,
  };
}

/**
 * 언어 문제 생성 (데이터 기반)
 */
function generateLanguageProblem(sub, level) {
  // sub에 따라 적절한 데이터 선택
  let questionBank = [];
  
  if (sub === 'voca' || sub === '어휘') {
    questionBank = GAME_DATA.language.voca || [];
  } else if (sub === 'grammar' || sub === '문법') {
    questionBank = GAME_DATA.language.grammar || [];
  } else {
    // 기본값: 어휘
    questionBank = GAME_DATA.language.voca || [];
  }

  // 레벨에 맞는 문제 필터링
  const levelQuestions = questionBank.filter(q => q.level <= level);
  
  if (levelQuestions.length === 0) {
    // 문제가 없으면 기본 문제 생성
    return {
      id: problemIdCounter++,
      type: 'choice',
      questionDisplay: '문제를 준비 중입니다.',
      answer: '1',
      hint: '언어 문제',
    };
  }

  const selectedQuestion = randomChoice(levelQuestions);
  
  return {
    id: problemIdCounter++,
    type: selectedQuestion.type || 'choice',
    questionDisplay: selectedQuestion.q,
    answer: String(selectedQuestion.a),
    hint: sub === 'voca' ? '어휘' : '문법',
    options: selectedQuestion.options, // choice 타입일 때 사용
  };
}

/**
 * 상식 문제 생성 (데이터 기반)
 */
function generateGeneralProblem(sub, level) {
  // sub에 따라 적절한 데이터 선택
  let questionBank = [];
  
  if (sub === 'history' || sub === '역사') {
    questionBank = GAME_DATA.general.history || [];
  } else if (sub === 'science' || sub === '과학') {
    questionBank = GAME_DATA.general.science || [];
  } else {
    // 기본값: 역사
    questionBank = GAME_DATA.general.history || [];
  }

  // 레벨에 맞는 문제 필터링
  const levelQuestions = questionBank.filter(q => q.level <= level);
  
  if (levelQuestions.length === 0) {
    // 문제가 없으면 기본 문제 생성
    return {
      id: problemIdCounter++,
      type: 'choice',
      questionDisplay: '문제를 준비 중입니다.',
      answer: '1',
      hint: '상식 문제',
    };
  }

  const selectedQuestion = randomChoice(levelQuestions);
  
  return {
    id: problemIdCounter++,
    type: selectedQuestion.type || 'choice',
    questionDisplay: selectedQuestion.q,
    answer: String(selectedQuestion.a),
    hint: sub === 'history' ? '역사' : '과학',
    options: selectedQuestion.options, // choice 타입일 때 사용
  };
}

/**
 * 논리 문제 생성 (추후 확장)
 */
function generateLogicProblem(sub, level) {
  // 임시로 간단한 문제 생성
  return {
    id: problemIdCounter++,
    type: 'ox',
    questionDisplay: `논리 문제 (${sub}, 레벨 ${level}) - 개발 중`,
    answer: 'O',
    hint: '논리 문제',
  };
}

/**
 * 게임 엔진 메인 함수
 * @param {string} category - 카테고리 ('math', 'language', 'general', 'logic')
 * @param {string} sub - 세부 분야 (예: 'arithmetic', 'voca', 'history')
 * @param {number} level - 레벨 (1~10)
 * @returns {Object} 문제 객체 { id, type, questionDisplay, answer, hint }
 */
function generateProblem(category, sub, level) {
  // 레벨 유효성 검사
  if (typeof level !== 'number' || level < 1 || level > 10) {
    level = 1;
  }

  // 카테고리별 문제 생성
  switch (category) {
    case 'math':
    case '수학':
      return generateMathProblem(sub, level);
    
    case 'language':
    case '언어':
      return generateLanguageProblem(sub, level);
    
    case 'general':
    case '상식':
      return generateGeneralProblem(sub, level);
    
    case 'logic':
    case '논리':
      return generateLogicProblem(sub, level);
    
    default:
      // 기본값: 수학 문제
      return generateMathProblem('arithmetic', level);
  }
}

// 전역 객체로 export
const GameEngine = {
  generateProblem: generateProblem,
  GAME_DATA: GAME_DATA, // 디버깅용으로 데이터 노출
};

// 브라우저 환경에서 사용 가능하도록 전역 객체로 등록
if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}

// Node.js 환경에서도 사용 가능하도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}

