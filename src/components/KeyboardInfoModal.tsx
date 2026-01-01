import { useState, FormEvent, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { APP_CONFIG } from '../config/app';
import { useSettingsStore } from '../stores/useSettingsStore';
import { CustomKeypad } from './CustomKeypad';
import { QwertyKeypad } from './QwertyKeypad';
import '../pages/QuizPage.css';
import './KeyboardInfoModal.css';

interface KeyboardInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KeyboardInfo {
  category: string;
  categoryName: string;
  subTopic: string;
  subTopicName: string;
  icon: string;
  keyboardType: 'qwerty-text' | 'custom' | 'qwerty-number';
  allowNegative: boolean;
  levels: Array<{ level: number; name: string }>;
}

type KeyboardDisplayType = 'qwerty-text' | 'qwerty-number' | 'custom';

export function KeyboardInfoModal({ isOpen, onClose }: KeyboardInfoModalProps) {
  // Zustand Selector 패턴 적용
  const keyboardType = useSettingsStore((state) => state.keyboardType);
  const [, setIsLandscape] = useState(false);

  // 키보드 타입별로 사용되는 카테고리 정보 수집 함수
  const getKeyboardTypeInfo = useMemo(() => {
    return (type: KeyboardDisplayType): KeyboardInfo[] => {
      const categories: KeyboardInfo[] = [];

      Object.entries(APP_CONFIG.SUB_TOPICS).forEach(([categoryId, subTopics]) => {
        const categoryName =
          APP_CONFIG.CATEGORY_MAP[categoryId as keyof typeof APP_CONFIG.CATEGORY_MAP];

        subTopics.forEach((subTopic) => {
          const levels =
            (APP_CONFIG.LEVELS[categoryId as keyof typeof APP_CONFIG.LEVELS] as any)?.[
              subTopic.id as string
            ] || [];

          let kbType: 'qwerty-text' | 'custom' | 'qwerty-number' | null = null;
          let allowNegative = false;
          let shouldInclude = false;

          if (type === 'qwerty-text') {
            if (categoryId === 'language' && subTopic.id === 'japanese') {
              kbType = 'qwerty-text';
              shouldInclude = true;
            }
          } else if (type === 'qwerty-number') {
            if (
              keyboardType === 'qwerty' &&
              !(categoryId === 'language' && subTopic.id === 'japanese')
            ) {
              kbType = 'qwerty-number';
              shouldInclude = true;
              if (
                categoryId === 'math' &&
                (subTopic.id === 'equations' || subTopic.id === 'calculus')
              ) {
                allowNegative = true;
              }
            }
          } else if (type === 'custom') {
            if (
              keyboardType === 'custom' &&
              !(categoryId === 'language' && subTopic.id === 'japanese')
            ) {
              kbType = 'custom';
              shouldInclude = true;
              if (
                categoryId === 'math' &&
                (subTopic.id === 'equations' || subTopic.id === 'calculus')
              ) {
                allowNegative = true;
              }
            }
          }

          if (shouldInclude && kbType) {
            categories.push({
              category: categoryId,
              categoryName,
              subTopic: subTopic.id,
              subTopicName: subTopic.name,
              icon: subTopic.icon,
              keyboardType: kbType,
              allowNegative,
              levels: levels.map((l: any) => ({ level: l.level, name: l.name })),
            });
          }
        });
      });

      return categories;
    };
  }, [keyboardType]);

  // 키보드 타입 목록 (사용 가능한 것만) - useMemo로 메모이제이션
  const availableKeyboardTypes = useMemo(() => {
    const types: KeyboardDisplayType[] = [];

    if (getKeyboardTypeInfo('qwerty-text').length > 0) {
      types.push('qwerty-text');
    }
    if (getKeyboardTypeInfo('qwerty-number').length > 0) {
      types.push('qwerty-number');
    }
    if (getKeyboardTypeInfo('custom').length > 0) {
      types.push('custom');
    }

    return types;
  }, [getKeyboardTypeInfo]);

  const [selectedKeyboardType, setSelectedKeyboardType] = useState<KeyboardDisplayType | null>(
    () => {
      // 초기값 계산
      if (availableKeyboardTypes.length === 0) return null;
      if (keyboardType === 'qwerty' && availableKeyboardTypes.includes('qwerty-number')) {
        return 'qwerty-number';
      }
      if (keyboardType === 'custom' && availableKeyboardTypes.includes('custom')) {
        return 'custom';
      }
      return availableKeyboardTypes[0];
    }
  );
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // 설정값 변경 시 키보드 타입 업데이트
  useEffect(() => {
    if (availableKeyboardTypes.length > 0) {
      let initialType: KeyboardDisplayType | null = null;
      if (keyboardType === 'qwerty' && availableKeyboardTypes.includes('qwerty-number')) {
        initialType = 'qwerty-number';
      } else if (keyboardType === 'custom' && availableKeyboardTypes.includes('custom')) {
        initialType = 'custom';
      } else {
        initialType = availableKeyboardTypes[0];
      }

      if (
        initialType &&
        (!selectedKeyboardType || !availableKeyboardTypes.includes(selectedKeyboardType))
      ) {
        setSelectedKeyboardType(initialType);
      }
      setSelectedCategoryIndex(0);
    }
  }, [keyboardType, availableKeyboardTypes, selectedKeyboardType]);

  // 현재 선택된 키보드 타입의 카테고리 정보
  const currentCategories = useMemo(() => {
    if (!selectedKeyboardType) return [];
    return getKeyboardTypeInfo(selectedKeyboardType);
  }, [selectedKeyboardType, getKeyboardTypeInfo]);

  const currentCategory =
    currentCategories.length > 0
      ? currentCategories[selectedCategoryIndex] || currentCategories[0]
      : null;

  // 카테고리 인덱스가 범위를 벗어나면 0으로 리셋
  useEffect(() => {
    if (currentCategories.length > 0 && selectedCategoryIndex >= currentCategories.length) {
      setSelectedCategoryIndex(0);
    }
  }, [currentCategories.length, selectedCategoryIndex]);

  // 화면 방향 감지
  useEffect(() => {
    const checkOrientation = () => {
      let landscape = false;

      // 1순위: screen.orientation API
      if (screen.orientation) {
        landscape = screen.orientation.type.includes('landscape');
      }
      // 2순위: matchMedia
      else if (window.matchMedia) {
        landscape = window.matchMedia('(orientation: landscape)').matches;
      }
      // 3순위: 폴백
      else {
        landscape = window.innerWidth > window.innerHeight;
      }

      setIsLandscape(landscape);
    };

    checkOrientation();

    const handleOrientationChange = () => {
      setTimeout(checkOrientation, 100);
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', handleOrientationChange);

    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    let mediaQuery: MediaQueryList | null = null;
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(orientation: landscape)');
      mediaQuery.addEventListener('change', handleOrientationChange);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  // 실제 키보드 핸들러 (인게임과 동일하게 동작)
  const handleKeyPress = (_key: string) => {
    // 실제 키보드 동작 (필요시 추가 가능)
  };

  const handleClear = () => {
    // 실제 키보드 동작
  };

  const handleBackspace = () => {
    // 실제 키보드 동작
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // 실제 키보드 동작
  };

  const handlePrevKeyboard = () => {
    if (availableKeyboardTypes.length === 0 || !selectedKeyboardType) return;
    const currentIndex = availableKeyboardTypes.indexOf(selectedKeyboardType);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableKeyboardTypes.length - 1;
    setSelectedKeyboardType(availableKeyboardTypes[prevIndex]);
    setSelectedCategoryIndex(0);
  };

  const handleNextKeyboard = () => {
    if (availableKeyboardTypes.length === 0 || !selectedKeyboardType) return;
    const currentIndex = availableKeyboardTypes.indexOf(selectedKeyboardType);
    const nextIndex = currentIndex < availableKeyboardTypes.length - 1 ? currentIndex + 1 : 0;
    setSelectedKeyboardType(availableKeyboardTypes[nextIndex]);
    setSelectedCategoryIndex(0);
  };

  const getKeyboardTypeName = (type: KeyboardDisplayType) => {
    switch (type) {
      case 'qwerty-text':
        return '쿼티 키보드 (텍스트)';
      case 'qwerty-number':
        return '숫자 키보드';
      case 'custom':
        return '커스텀 키패드';
    }
  };

  // Portal을 사용해서 document.body의 직접 자식으로 렌더링 (MyPage 위에 올라오지 않도록)
  if (!isOpen) return null;

  const modalContent = (() => {
    if (
      !selectedKeyboardType ||
      availableKeyboardTypes.length === 0 ||
      currentCategories.length === 0 ||
      !currentCategory
    ) {
      return (
        <div className="keyboard-info-modal-overlay" onClick={onClose}>
          <div className="keyboard-info-modal quiz-page" onClick={(e) => e.stopPropagation()}>
            <div className="keyboard-info-modal-header">
              <h2 className="keyboard-info-modal-title">키보드 미리보기</h2>
              <p className="keyboard-info-modal-subtitle">
                {availableKeyboardTypes.length === 0
                  ? '사용 가능한 키보드가 없습니다.'
                  : !selectedKeyboardType
                    ? '로딩 중...'
                    : '사용 가능한 카테고리가 없습니다.'}
              </p>
            </div>
            <button className="keyboard-info-modal-close" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="keyboard-info-modal-overlay" onClick={onClose}>
        <div className="keyboard-info-modal quiz-page" onClick={(e) => e.stopPropagation()}>
          {/* 퀴즈 페이지와 동일한 헤더 구조 */}
          <header className="quiz-header">
            <button className="quiz-back-button" onClick={onClose} aria-label="뒤로 가기">
              ←
            </button>
            <div className="quiz-timer-container">
              <h2 className="keyboard-info-modal-title">
                {getKeyboardTypeName(selectedKeyboardType)}
              </h2>
            </div>
            <div className="quiz-header-spacer"></div>
          </header>

          {/* 퀴즈 페이지와 동일한 컨텐츠 영역 구조 */}
          <div className="quiz-content keyboard-info-content-wrapper">
            {/* 카테고리 선택 탭 (좌우 스크롤) - 키보드 위에 오버레이로 배치 */}
            <div className="keyboard-info-category-tabs">
              <div className="keyboard-info-category-tabs-scroll">
                {currentCategories.map((info, index) => (
                  <button
                    key={`${info.category}-${info.subTopic}`}
                    className={`keyboard-info-category-tab ${selectedCategoryIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryIndex(index)}
                  >
                    <span className="keyboard-info-tab-icon">{info.icon}</span>
                    <span className="keyboard-info-tab-name">{info.subTopicName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 키보드 네비게이션 버튼 (키보드 위에 오버레이) */}
            <div className="keyboard-info-nav-wrapper">
              <button
                className="keyboard-info-nav-button keyboard-info-nav-prev"
                onClick={handlePrevKeyboard}
                aria-label="이전 키보드 타입"
              >
                ‹
              </button>
              <span className="keyboard-info-nav-label">
                {getKeyboardTypeName(selectedKeyboardType)}
              </span>
              <button
                className="keyboard-info-nav-button keyboard-info-nav-next"
                onClick={handleNextKeyboard}
                aria-label="다음 키보드 타입"
              >
                ›
              </button>
            </div>

            {/* 키보드 - 퀴즈 페이지와 완전히 동일한 위치에 배치 (quiz-content의 직접 자식) */}
            {selectedKeyboardType === 'custom' && (
              <CustomKeypad
                onNumberClick={handleKeyPress}
                onClear={handleClear}
                onBackspace={handleBackspace}
                onSubmit={handleSubmit}
                disabled={false}
                showNegative={currentCategory.allowNegative}
              />
            )}
            {selectedKeyboardType === 'qwerty-text' && (
              <QwertyKeypad
                onKeyPress={handleKeyPress}
                onClear={handleClear}
                onBackspace={handleBackspace}
                onSubmit={handleSubmit}
                disabled={false}
                mode="text"
              />
            )}
            {selectedKeyboardType === 'qwerty-number' && (
              <QwertyKeypad
                onKeyPress={handleKeyPress}
                onClear={handleClear}
                onBackspace={handleBackspace}
                onSubmit={handleSubmit}
                disabled={false}
                mode="number"
                allowNegative={currentCategory.allowNegative}
              />
            )}

            <div className="keyboard-info-preview-indicator">
              레벨{' '}
              {currentCategory.levels.length > 0 ? `1-${currentCategory.levels.length}` : '없음'} (
              {currentCategory.levels.length}개)
            </div>
          </div>
        </div>
      </div>
    );
  })();

  // Portal을 사용해서 document.body의 직접 자식으로 렌더링
  return createPortal(modalContent, document.body);
}
