/**
 * @apps-in-toss/web-framework의 Mock 구현체
 * Vercel 환경에서 브릿지 API 호출 시 에러 없이 작동하도록 돕습니다.
 */

export const submitGameCenterLeaderBoardScore = async (data: any) => {
  console.log('[Mock] 점수 제출됨:', data);
  return { statusCode: 'SUCCESS' };
};

export const openGameCenterLeaderboard = () => {
  console.log('[Mock] 리더보드 열기 시도');
};

export const isMinVersionSupported = () => true;

export const getOperationalEnvironment = () => 'review'; // 또는 'toss'를 흉내낼 수 있음

export const appLogin = async () => {
  console.log('[Mock] 로그인 호출됨');
  return {
    authorizationCode: 'MOCK_AUTH_CODE_' + Date.now(),
    referrer: 'VERCEL_REVIEW',
  };
};

export const getUserKeyForGame = async () => {
  return {
    type: 'HASH',
    hash: 'MOCK_GAME_HASH_' + Math.random().toString(36).substring(7),
  };
};

export const getIsTossLoginIntegratedService = async () => true;

export const generateHapticFeedback = (data: any) => {
  console.log('[Mock] 햅틱 피드백:', data.type);
};
