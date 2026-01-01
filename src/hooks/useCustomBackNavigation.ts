import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';

/**
 * 브라우저 뒤로가기 버튼 동작을 커스터마이징하는 훅
 *
 * 규칙:
 * 1. 메인 페이지(홈, 랭킹, 챌린지, 마이)에서 뒤로가기 → 홈으로 이동
 * 2. 홈에서 뒤로가기 → 마이 페이지로 이동
 * 3. 그 외 페이지에서 뒤로가기 → 상위 페이지로 이동
 */
export function useCustomBackNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPathRef = useRef<string>(location.pathname);
  const previousSearchRef = useRef<string>(location.search);
  const isHandlingPopStateRef = useRef<boolean>(false);

  useEffect(() => {
    // 이전 경로와 쿼리 파라미터 업데이트
    previousPathRef.current = location.pathname;
    previousSearchRef.current = location.search;
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      // 중복 처리 방지
      if (isHandlingPopStateRef.current) {
        return;
      }

      // 이전 위치 (popstate 발생 전)
      const previousPath = previousPathRef.current;
      const previousSearch = previousSearchRef.current;

      // 이전 위치를 기준으로 커스텀 네비게이션 결정
      const pathToCheck = previousPath;
      const paramsToCheck = new URLSearchParams(previousSearch);

      isHandlingPopStateRef.current = true;

      // 메인 페이지 목록
      const mainPages: string[] = [
        APP_CONFIG.ROUTES.HOME,
        APP_CONFIG.ROUTES.RANKING,
        APP_CONFIG.ROUTES.MY_PAGE,
      ];

      // 케이스 1: 메인 페이지에서 뒤로가기
      if (mainPages.includes(pathToCheck)) {
        if (pathToCheck === APP_CONFIG.ROUTES.HOME) {
          // 홈에서 뒤로가기 처리
          // 가이드: "진입 시 첫 화면에서는 백버튼을 사용하지 않아요"
          // 히스토리가 없으면(첫 진입) 뒤로가기 무시
          const historyLength = window.history.length;
          const hasHistory = historyLength > 1 || document.referrer !== '';

          if (!hasHistory) {
            // 첫 진입 시: 뒤로가기 무시 (가이드 준수)
            navigate(previousPath + previousSearch, { replace: true });
            setTimeout(() => {
              isHandlingPopStateRef.current = false;
            }, 100);
            return;
          }

          // 히스토리가 있는 경우: 커스텀 이벤트 발생 (HomePage에서 토스트 표시)
          const customEvent = new CustomEvent('home-back-button', {
            detail: { previousPath: previousPath, previousSearch: previousSearch },
          });
          window.dispatchEvent(customEvent);

          // 이전 위치 유지 (뒤로가기 취소)
          navigate(previousPath + previousSearch, { replace: true });

          setTimeout(() => {
            isHandlingPopStateRef.current = false;
          }, 100);
          return;
        } else {
          // 다른 메인 페이지에서 뒤로가기 → 홈으로 이동
          navigate(APP_CONFIG.ROUTES.HOME, { replace: true });
        }
        setTimeout(() => {
          isHandlingPopStateRef.current = false;
        }, 100);
        return;
      }

      // 케이스 2: 그 외 페이지에서 뒤로가기 → 상위 페이지로 이동
      let targetPath = '';
      const newSearchParams = new URLSearchParams();

      switch (pathToCheck) {
        case APP_CONFIG.ROUTES.GAME: {
          // /level-select로 이동 (category, sub 파라미터 유지)
          targetPath = APP_CONFIG.ROUTES.LEVEL_SELECT;
          const category = paramsToCheck.get('category');
          const sub = paramsToCheck.get('sub');
          if (category) newSearchParams.set('category', category);
          if (sub) newSearchParams.set('sub', sub);
          break;
        }

        case APP_CONFIG.ROUTES.LEVEL_SELECT: {
          // /subcategory로 이동 (category 파라미터 유지)
          targetPath = APP_CONFIG.ROUTES.SUB_CATEGORY;
          const categoryParam = paramsToCheck.get('category');
          if (categoryParam) newSearchParams.set('category', categoryParam);
          break;
        }

        case APP_CONFIG.ROUTES.SUB_CATEGORY: {
          // 홈으로 이동
          targetPath = APP_CONFIG.ROUTES.HOME;
          break;
        }

        case APP_CONFIG.ROUTES.RESULT: {
          // 쿼리 파라미터를 확인하여 /quiz로 이동하거나 홈으로
          const resultCategory = paramsToCheck.get('category');
          const resultSub = paramsToCheck.get('sub');
          const resultLevel = paramsToCheck.get('level');
          if (resultCategory && resultSub && resultLevel) {
            targetPath = APP_CONFIG.ROUTES.GAME;
            newSearchParams.set('category', resultCategory);
            newSearchParams.set('sub', resultSub);
            newSearchParams.set('level', resultLevel);
            const mode = paramsToCheck.get('mode');
            if (mode) newSearchParams.set('mode', mode);
          } else {
            targetPath = APP_CONFIG.ROUTES.HOME;
          }
          break;
        }

        case APP_CONFIG.ROUTES.NOTIFICATIONS: {
          // /notifications
          // 홈으로 이동
          targetPath = APP_CONFIG.ROUTES.HOME;
          break;
        }

        default:
          // 알 수 없는 경로는 홈으로 이동
          targetPath = APP_CONFIG.ROUTES.HOME;
          break;
      }

      // 쿼리 파라미터가 있으면 추가
      const queryString = newSearchParams.toString();
      const finalPath = queryString ? `${targetPath}?${queryString}` : targetPath;

      navigate(finalPath, { replace: true });

      setTimeout(() => {
        isHandlingPopStateRef.current = false;
      }, 100);
    };

    // popstate 이벤트 리스너 등록
    window.addEventListener('popstate', handlePopState);

    // 클린업 함수
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate, location.pathname, location.search]);
}
