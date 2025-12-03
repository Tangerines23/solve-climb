// 게임 내 메시지 상수 모음
// 중앙 관리 및 다국어 지원을 위한 메시지 상수

export const MESSAGES = {
  // 정답/오답 관련
  CORRECT: '정답입니다!',
  INCORRECT: '틀렸습니다.',
  INVALID_INPUT: '숫자를 입력해주세요.',
  OUT_OF_RANGE: '범위를 벗어난 숫자입니다.',
  
  // 제출 관련
  SUBMITTING: '채점 중...',
  SUBMIT: '제출',
  
  // 게임 상태 관련
  GAME_OVER: '게임 오버',
  TIME_UP: '시간 종료!',
  PAUSED: '일시정지',
  RESUMED: '계속하기',
  
  // 레벨 관련
  LEVEL_CLEARED: '레벨 클리어!',
  LEVEL_UNLOCKED: '레벨이 언락되었습니다.',
  NEXT_LEVEL: '다음 레벨',
  RETRY: '다시 도전하기',
  CONTINUE: '계속',
  
  // 로딩/에러 관련
  LOADING: '불러오는 중...',
  LOADING_RANKINGS: '랭킹을 불러오는 중...',
  LOADING_NOTIFICATIONS: '알림을 불러오는 중...',
  LOADING_STATS: '통계를 불러오는 중...',
  
  ERROR_GENERIC: '문제가 생겨서 불러오질 못했어요 ㅠㅠ',
  ERROR_RANKINGS: '랭킹 데이터를 불러올 수 없습니다',
  ERROR_NOTIFICATIONS: '알림 데이터를 불러올 수 없습니다',
  ERROR_STATS: '통계 데이터를 불러올 수 없습니다',
  ERROR_NETWORK: '네트워크 연결을 확인해주세요',
  ERROR_SERVER: '서버에 연결할 수 없습니다',
  
  // 프로필 관련
  PROFILE_NOT_CREATED: '프로필이 생성되지 않았습니다.',
  PROFILE_REQUIRED: '프로필을 먼저 생성해주세요.',
  
  // 인증 관련
  LOGIN_SUCCESS: '로그인 성공',
  LOGIN_FAILED: '로그인 실패',
  LOGOUT_SUCCESS: '로그아웃되었습니다',
  LOGOUT_FAILED: '로그아웃 중 오류가 발생했습니다.',
  LOGIN_ERROR: '로그인 중 오류가 발생했습니다.',
  
  // 데이터 관련
  DATA_RESET_SUCCESS: '데이터가 초기화되었습니다',
  DATA_RESET_FAILED: '데이터 초기화 중 오류가 발생했습니다.',
  DATA_SAVE_SUCCESS: '데이터가 저장되었습니다',
  DATA_SAVE_FAILED: '데이터 저장 중 오류가 발생했습니다.',
  
  // 랭킹 관련
  MY_RANKING: '나의 순위',
  RANKING_DETAIL: '자세히',
  NO_RANKING_DATA: '랭킹 데이터가 없습니다',
  SHARE_SCORE: '공유하기',
  
  // 챌린지 관련
  CHALLENGE_PARTICIPANTS: '참여자',
  CHALLENGE_JOIN: '참여하기',
  CHALLENGE_LEAVE: '참여 취소',
  
  // 알림 관련
  NO_NOTIFICATIONS: '알림이 없습니다',
  NOTIFICATION_READ: '읽음',
  NOTIFICATION_UNREAD: '읽지 않음',
  
  // 설정 관련
  SETTINGS: '설정',
  SETTINGS_SAVED: '설정이 저장되었습니다',
  
  // 확인/취소
  CONFIRM: '확인',
  CANCEL: '취소',
  DELETE: '삭제',
  SAVE: '저장',
  CLOSE: '닫기',
  
  // 기타
  RETRY_LATER: '나중에 다시 시도해주세요',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
  SUCCESS: '성공',
  FAILED: '실패',
  
  // 일본어 퀴즈 관련
  ROMAJI_INPUT_PLACEHOLDER: '로마지 입력 (예: a, ki)',
  ANSWER_INPUT_PLACEHOLDER: '정답 입력',
  
  // 게임 모드 관련
  TIME_ATTACK_MODE: '타임 어택',
  SURVIVAL_MODE: '서바이벌',
  
  // 레벨 선택 관련
  LEVEL_SELECT: '레벨 선택',
  LEVEL_LOCKED: '잠금',
  LEVEL_COMPLETED: '완료',
  
  // 리더보드 관련
  LEADERBOARD_OPEN_FAILED: '리더보드를 열 수 없습니다. 토스앱에서 실행 중인지 확인해주세요.',
  LEADERBOARD_VIEW: '토스 게임 센터 리더보드 보기',
  
  // 토스트 메시지
  TOAST_DONT_SHOW_AGAIN_UNLOCKED: '다시 보지 않기가 풀립니다',
  
  // 관리자 관련
  ADMIN_LOGIN_FAILED: 'Admin 로그인 실패',
  
  // 통계 관련
  STATS_LOADING: '통계를 불러오는 중...',
  STATS_ERROR: '통계를 불러올 수 없습니다',
  BEST_SCORE: '최고 점수',
  TOTAL_GAMES: '총 게임 수',
  RANK_PERCENT: '상위',
  
  // 기간 선택
  PERIOD_TODAY: '오늘',
  PERIOD_WEEK: '이번 주',
  PERIOD_MONTH: '이번 달',
  PERIOD_ALL: '전체',
} as const;

// 메시지 타입 (타입 안전성을 위해)
export type MessageKey = keyof typeof MESSAGES;

// 메시지 가져오기 헬퍼 함수
export function getMessage(key: MessageKey): string {
  return MESSAGES[key];
}

