import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { bgm } from '@/utils/sound';

/**
 * 전역 BGM 라우트 관리자 컴포넌트
 * - 페이지 경로 및 설정 변경을 감지하여 적절한 BGM을 자동 전환
 * - 로비 탭 간 이동 시에는 끊김 없이 연속 재생 유지
 */
export function GlobalBgmManager() {
  const location = useLocation();
  const bgmEnabled = useSettingsStore((state) => state.bgmEnabled);

  useEffect(() => {
    if (!bgmEnabled) {
      bgm.stop(0.3);
      return;
    }

    const path = location.pathname;

    // 1. 디버그 페이지: 버튼 직접 테스트를 위해 자동 재생 비활성화
    if (path.startsWith('/debug')) {
      return;
    }

    // 2. 인게임 퀴즈 페이지: 퀴즈 내부 생명주기(useQuizBgm)에서 직접 제어
    if (path.startsWith('/quiz')) {
      return;
    }

    // 3. 결과 페이지: 결과창(완등/실패) 로직에서 직접 제어
    if (path.startsWith('/result')) {
      return;
    }

    // 4. 상점 페이지: 산악 만물상 BGM
    if (path.startsWith('/shop')) {
      bgm.play('shop');
      return;
    }

    // 5. 로비 구역 전역 (홈, 카테고리, 레벨, 랭킹, 로드맵, 복습, 마이페이지, 알림 등)
    // 이미 'brain_age'가 재생 중이면 중단 없이 매끄럽게 지속
    bgm.play('brain_age');
  }, [location.pathname, bgmEnabled]);

  return null;
}
