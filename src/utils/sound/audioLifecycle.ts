import { Capacitor } from '@capacitor/core';
import { audioContextManager } from './audioContext';
import { bgm } from './bgmEngine';

let isLifecycleInitialized = false;
let removeCapacitorListeners: (() => void) | null = null;
let removeWebListeners: (() => void) | null = null;

/**
 * 앱 백그라운드 전환 시 모든 오디오 안전 일시정지
 * - BGM 스케줄러 즉각 중단 및 재생 중인 Web Audio 노드 소멸
 * - AudioContext suspend를 호출하여 모바일 하드웨어 사운드 출력 완전 차단
 */
export async function pauseAllAudio(): Promise<void> {
  bgm.pauseForBackground();
  await audioContextManager.suspend(true);
}

/**
 * 앱 포그라운드 복귀 시 오디오 정상 재개
 * - AudioContext resume 후 이전에 재생 중이던 BGM 테마 부드러운 페이드인 재개
 */
export async function resumeAllAudio(): Promise<void> {
  await audioContextManager.resume(true);
  bgm.resumeFromBackground();
}

/**
 * 앱 완전 종료/페이지 이탈 시 오디오 즉각 파괴
 * - 볼륨 페이드아웃 대기 없이 0초 즉시 모든 오디오 노드 강제 차단 및 컨텍스트 정리
 */
export async function terminateAllAudio(): Promise<void> {
  bgm.stopImmediate();
  await audioContextManager.close();
}

/**
 * 모바일(Capacitor 네이티브) 및 브라우저 환경 통합 오디오 생명주기 리스너 등록
 * - Android/iOS 홈 버튼, 최근 앱 전환기(App Switcher), 화면 잠금 시 사운드 누출 원천 차단
 * - 웹 document.visibilitychange, window.pagehide, beforeunload 완벽 대응
 */
export function setupAudioLifecycle(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  if (isLifecycleInitialized) {
    return teardownAudioLifecycle;
  }

  isLifecycleInitialized = true;

  // 1. Web 표준 생명주기 이벤트 (모든 브라우저 및 WebView 공통)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      void pauseAllAudio();
      return;
    }
    void resumeAllAudio();
  };

  const handlePageHide = () => {
    void terminateAllAudio();
  };

  const handleBeforeUnload = () => {
    void terminateAllAudio();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handleBeforeUnload);

  removeWebListeners = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };

  // 2. Capacitor 네이티브 플랫폼 생명주기 이벤트 (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    let unmounted = false;
    import('@capacitor/app')
      .then(({ App }) => {
        if (unmounted) return;

        const handles: { remove: () => Promise<void> | void }[] = [];

        // App 상태 변경: 홈 버튼 누름, 앱 전환기 진입, 화면 꺼짐 등
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            void pauseAllAudio();
            return;
          }
          void resumeAllAudio();
        }).then((h) => handles.push(h));

        // 네이티브 Pause (백그라운드 전환)
        App.addListener('pause', () => {
          void pauseAllAudio();
        }).then((h) => handles.push(h));

        // 네이티브 Resume (포그라운드 복귀)
        App.addListener('resume', () => {
          void resumeAllAudio();
        }).then((h) => handles.push(h));

        removeCapacitorListeners = () => {
          unmounted = true;
          handles.forEach((h) => {
            try {
              void h.remove();
            } catch {
              // ignore
            }
          });
        };
      })
      .catch((err) => {
        console.warn('[AudioLifecycle] Failed to load @capacitor/app plugin:', err);
      });
  }

  return teardownAudioLifecycle;
}

/**
 * 생명주기 리스너 해제 (테스트 및 모듈 리셋용)
 */
export function teardownAudioLifecycle(): void {
  if (removeWebListeners) {
    removeWebListeners();
    removeWebListeners = null;
  }
  if (removeCapacitorListeners) {
    removeCapacitorListeners();
    removeCapacitorListeners = null;
  }
  isLifecycleInitialized = false;
}
