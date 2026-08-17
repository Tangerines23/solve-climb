import { useEffect } from 'react';
import { bgm, type BgmTheme } from '@/utils/sound';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface UseQuizBgmProps {
  categoryParam: string | null;
  modeParam: string | null;
  showTipModal: boolean;
  showLastChanceModal: boolean;
  showCountdown: boolean;
  showPauseModal?: boolean;
  isLastSpurtActive?: boolean;
}

/**
 * 인게임 퀴즈 생명주기 및 모달 상태에 따른 BGM 전환 훅
 * - 일반 레벨 등반: 🧗‍♀️ 셀레스트 등반 (Celeste 118 BPM - 경쾌한 멜로디)
 * - 라스트 스퍼트(부활 15초 질주) & 서바이벌 무한 모드: 🧗‍♂️ 클라이머 펄스 (Climber Pulse 112 BPM - 박진감 넘치는 질주 비트)
 * - 대수 / 심화 / 논리 수학 모드: 🧩 퀴즈 포커스 (Quiz Focus 92 BPM)
 * - 라스트 찬스 (탈락 직전 부활 모달): 💓 위기 펄스 (Crisis Heartbeat 126 BPM - 쿵쿵 심장박동)
 * - 게임팁 모달: 🧠 두뇌 트레이닝 (Brain Age 104 BPM) 유지
 * - 일시정지 & 카운트다운(3.. 2.. 1..): 완전 무음(Silence)
 */
export function useQuizBgm({
  categoryParam,
  modeParam,
  showTipModal,
  showLastChanceModal,
  showCountdown,
  showPauseModal = false,
  isLastSpurtActive = false,
}: UseQuizBgmProps) {
  const bgmEnabled = useSettingsStore((s) => s.bgmEnabled);

  useEffect(() => {
    if (!bgmEnabled) {
      bgm.stop(0.2);
      return;
    }

    // 1. 게임 팁 모달 (등반 전 작전 브리핑): 로비 BGM(두뇌 트레이닝) 자연스럽게 연속 유지
    if (showTipModal) {
      bgm.play('brain_age');
      return;
    }

    // 2. 일시정지 중 or 카운트다운(3, 2, 1) 중: 게임이 멈췄으므로 BGM 완전 정지(무음)
    if (showPauseModal || showCountdown) {
      bgm.stop(0.15);
      return;
    }

    // 3. 라스트 찬스 모달 (탈락 직전 부활 선택): 긴박한 심장박동 텐션 (crisis)
    if (showLastChanceModal) {
      bgm.play('crisis');
      return;
    }

    // 4. 인게임 메인 플레이 BGM 테마 결정 및 시작!
    // - 라스트 스퍼트 발동(부활 15초 피버 질주) 또는 서바이벌 모드: 클라이머 펄스 (climb)
    // - 고급 수학/논리 카테고리: 퀴즈 포커스 (puzzle)
    // - 일반 모든 레벨 메인 등반: 셀레스트 등반 (celeste)
    const inGameTheme: BgmTheme =
      isLastSpurtActive || modeParam === 'survival'
        ? 'climb'
        : categoryParam === '대수' || categoryParam === '심화' || categoryParam === '논리'
          ? 'puzzle'
          : 'celeste';

    bgm.play(inGameTheme);
  }, [
    bgmEnabled,
    categoryParam,
    modeParam,
    showTipModal,
    showLastChanceModal,
    showCountdown,
    showPauseModal,
    isLastSpurtActive,
  ]);

  // 퀴즈 페이지 언마운트 시(결과창/로비 이동 등) 인게임 BGM 정리
  useEffect(() => {
    return () => {
      const current = bgm.getCurrentTheme();
      if (
        current === 'celeste' ||
        current === 'climb' ||
        current === 'puzzle' ||
        current === 'crisis'
      ) {
        bgm.stop(0.2);
      }
    };
  }, []);
}
