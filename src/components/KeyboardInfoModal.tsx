import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { APP_CONFIG } from '../config/app';
import { useSettingsStore } from '../stores/useSettingsStore';
import { CustomKeypad } from './CustomKeypad';
import { QwertyKeypad } from './QwertyKeypad';
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
  const [isLandscape, setIsLandscape] = useState(false);
  
  // 키보드 타입별로 사용되는 카테고리 정보 수집 함수
  const getKeyboardTypeInfo = useMemo(() => {
    return (type: KeyboardDisplayType): KeyboardInfo[] => {
      const categories: KeyboardInfo[] = [];

      Object.entries(APP_CONFIG.SUB_TOPICS).forEach(([categoryId, subTopics]) => {
        const categoryName = APP_CONFIG.CATEGORY_MAP[categoryId as keyof typeof APP_CONFIG.CATEGORY_MAP];
        
        subTopics.forEach((subTopic) => {
          const levels = APP_CONFIG.LEVELS[categoryId as keyof typeof APP_CONFIG.LEVELS]?.[subTopic.id as string] || [];
          
          let kbType: 'qwerty-text' | 'custom' | 'qwerty-number' | null = null;
          let allowNegative = false;
          let shouldInclude = false;

          if (type === 'qwerty-text') {
            if (categoryId === 'language' && subTopic.id === 'japanese') {
              kbType = 'qwerty-text';
              shouldInclude = true;
            }
          } else if (type === 'qwerty-number') {
            if (keyboardType === 'qwerty' && !(categoryId === 'language' && subTopic.id === 'japanese')) {
              kbType = 'qwerty-number';
              shouldInclude = true;
              if (categoryId === 'math' && (subTopic.id === 'equations' || subTopic.id === 'calculus')) {
                allowNegative = true;
              }
            }
          } else if (type === 'custom') {
            if (keyboardType === 'custom' && !(categoryId === 'language' && subTopic.id === 'japanese')) {
              kbType = 'custom';
              shouldInclude = true;
              if (categoryId === 'math' && (subTopic.id === 'equations' || subTopic.id === 'calculus')) {
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
              levels: levels.map(l => ({ level: l.level, name: l.name })),
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

  const [selectedKeyboardType, setSelectedKeyboardType] = useState<KeyboardDisplayType | null>(() => {
    // 초기값 계산
    if (availableKeyboardTypes.length === 0) return null;
    if (keyboardType === 'qwerty' && availableKeyboardTypes.includes('qwerty-number')) {
      return 'qwerty-number';
    }
    if (keyboardType === 'custom' && availableKeyboardTypes.includes('custom')) {
      return 'custom';
    }
    return availableKeyboardTypes[0];
  });
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
      
      if (initialType && (!selectedKeyboardType || !availableKeyboardTypes.includes(selectedKeyboardType))) {
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

  const currentCategory = currentCategories.length > 0 
    ? (currentCategories[selectedCategoryIndex] || currentCategories[0])
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
  const handleKeyPress = (key: string) => {
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

  // 로딩 또는 에러 상태 처리 - 단일 조건으로 통합
  if (!isOpen) return null;
  
  if (!selectedKeyboardType || availableKeyboardTypes.length === 0 || currentCategories.length === 0 || !currentCategory) {
    return (
      <div className="keyboard-info-modal-overlay" onClick={onClose}>
        <div className="keyboard-info-modal" onClick={(e) => e.stopPropagation()}>
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
      <div className="keyboard-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-info-modal-header">
          <h2 className="keyboard-info-modal-title">{getKeyboardTypeName(selectedKeyboardType)}</h2>
        </div>

        {/* 카테고리 선택 탭 (좌우 스크롤) - 현재 키보드가 사용되는 레벨들 */}
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

        {/* 키보드 미리보기 (메인) */}
        <div className="keyboard-info-main-preview">
          <div className="keyboard-info-preview-header">
            <div className="keyboard-info-preview-title">
              <span className="keyboard-info-preview-icon">{currentCategory.icon}</span>
              <div>
                <div className="keyboard-info-preview-category">{currentCategory.categoryName}</div>
                <div className="keyboard-info-preview-subtopic">{currentCategory.subTopicName}</div>
              </div>
            </div>
            {currentCategory.allowNegative && (
              <span className="keyboard-info-negative-badge">음수 지원</span>
            )}
          </div>
          
          <div className="keyboard-info-preview-wrapper">
            <button 
              className="keyboard-info-nav-button keyboard-info-nav-prev"
              onClick={handlePrevKeyboard}
              aria-label="이전 키보드 타입"
            >
              ‹
            </button>
            
            <div className={`keyboard-info-preview-container-main ${isLandscape ? 'landscape' : 'portrait'}`}>
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
            </div>

            <button 
              className="keyboard-info-nav-button keyboard-info-nav-next"
              onClick={handleNextKeyboard}
              aria-label="다음 키보드 타입"
            >
              ›
            </button>
          </div>

          <div className="keyboard-info-preview-indicator">
            레벨 {currentCategory.levels.length > 0 ? `1-${currentCategory.levels.length}` : '없음'} ({currentCategory.levels.length}개)
          </div>
        </div>

        <button className="keyboard-info-modal-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

