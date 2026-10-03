import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { APP_CONFIG } from '../config/app';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useGameStore } from '../stores/useGameStore';
import { useOrientation } from '../hooks/useOrientation';
import { KeyboardPreview, type KeyboardDisplayType } from './KeyboardPreview';
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
  keyboardType: KeyboardDisplayType;
  allowNegative: boolean;
  levels: Array<{ level: number; name: string }>;
}

interface KeyboardCategoryResolution {
  shouldInclude: boolean;
  kbType: KeyboardDisplayType | null;
  allowNegative: boolean;
}

function resolveKeyboardCategory(
  type: KeyboardDisplayType,
  userKeyboardSetting: string,
  mtnId: string,
  categoryId: string
): KeyboardCategoryResolution {
  const isJapanese =
    mtnId === 'language' && (categoryId === '히라가나' || categoryId === '가타카나');

  if (type === 'qwerty-text') {
    if (isJapanese) {
      return { shouldInclude: true, kbType: 'qwerty-text', allowNegative: false };
    }
    return { shouldInclude: false, kbType: null, allowNegative: false };
  }

  if (isJapanese) {
    return { shouldInclude: false, kbType: null, allowNegative: false };
  }

  const isMathNegative = mtnId === 'math' && (categoryId === '대수' || categoryId === '심화');

  if (type === 'qwerty-number' && userKeyboardSetting === 'qwerty') {
    return { shouldInclude: true, kbType: 'qwerty-number', allowNegative: isMathNegative };
  }

  if (type === 'custom' && userKeyboardSetting === 'custom') {
    return { shouldInclude: true, kbType: 'custom', allowNegative: isMathNegative };
  }

  return { shouldInclude: false, kbType: null, allowNegative: false };
}

const KEYBOARD_TYPE_NAMES: Record<KeyboardDisplayType, string> = {
  'qwerty-text': '쿼티 키보드 (텍스트)',
  'qwerty-number': '숫자 키보드',
  custom: '커스텀 키패드',
};

function getKeyboardTypeName(type: KeyboardDisplayType): string {
  return KEYBOARD_TYPE_NAMES[type] ?? '';
}

export function KeyboardInfoModal({ isOpen, onClose }: KeyboardInfoModalProps) {
  const keyboardType = useSettingsStore((state) => state.keyboardType);
  useOrientation();

  // 키보드 타입별로 사용되는 카테고리 정보 수집 함수
  const getKeyboardTypeInfo = useMemo(() => {
    return (type: KeyboardDisplayType): KeyboardInfo[] => {
      const categories: KeyboardInfo[] = [];

      Object.entries(APP_CONFIG.SUB_TOPICS).forEach(([mtnId, subTopics]) => {
        subTopics.forEach((subTopic) => {
          const categoryId = subTopic.id;

          const levelsConfig = APP_CONFIG.LEVELS as unknown as Record<
            string,
            Record<string, Array<{ level: number; name: string; description: string }>>
          >;
          const worldLevels = Object.prototype.hasOwnProperty.call(levelsConfig, 'World1')
            ? levelsConfig['World1']
            : undefined;
          const levels =
            (worldLevels && Object.prototype.hasOwnProperty.call(worldLevels, categoryId)
              ? (worldLevels[categoryId] as Array<{
                  level: number;
                  name: string;
                  description: string;
                }>)
              : undefined) || [];

          const { shouldInclude, kbType, allowNegative } = resolveKeyboardCategory(
            type,
            keyboardType,
            mtnId,
            categoryId
          );

          if (shouldInclude && kbType) {
            categories.push({
              category: mtnId,
              categoryName:
                (Object.prototype.hasOwnProperty.call(APP_CONFIG.MOUNTAIN_MAP, mtnId)
                  ? (APP_CONFIG.MOUNTAIN_MAP as Record<string, string>)[mtnId]
                  : null) || mtnId,
              subTopic: categoryId,
              subTopicName: subTopic.name,
              icon: subTopic.icon,
              keyboardType: kbType,
              allowNegative,
              levels: levels.map((l) => ({ level: l.level, name: l.name })),
            });
          }
        });
      });

      return categories;
    };
  }, [keyboardType]);

  // 키보드 타입 목록 (사용 가능한 것만)
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

  // 설정값 변경 시 키보드 타입 및 카테고리 인덱스 업데이트
  useEffect(() => {
    if (availableKeyboardTypes.length > 0) {
      const initialType: KeyboardDisplayType =
        keyboardType === 'qwerty' && availableKeyboardTypes.includes('qwerty-number')
          ? 'qwerty-number'
          : keyboardType === 'custom' && availableKeyboardTypes.includes('custom')
            ? 'custom'
            : availableKeyboardTypes[0]!;

      setSelectedKeyboardType(initialType);
      setSelectedCategoryIndex(0);
    }
  }, [keyboardType, availableKeyboardTypes]);

  // 키보드 미리보기 진입 시 이전 인게임 콤보 및 피버 상태 초기화
  useEffect(() => {
    if (isOpen) {
      useGameStore.setState({ showSpeedLines: false, feverLevel: 0, combo: 0 });
    }
  }, [isOpen]);

  // 현재 선택된 키보드 타입의 카테고리 정보
  const currentCategories = useMemo(() => {
    if (!selectedKeyboardType) return [];
    return getKeyboardTypeInfo(selectedKeyboardType);
  }, [selectedKeyboardType, getKeyboardTypeInfo]);

  const currentCategory =
    currentCategories.length > 0
      ? ((Object.prototype.hasOwnProperty.call(currentCategories, selectedCategoryIndex)
          ? currentCategories[selectedCategoryIndex]
          : undefined) ??
        (Object.prototype.hasOwnProperty.call(currentCategories, 0)
          ? currentCategories[0]
          : undefined) ??
        null)
      : null;

  // 카테고리 인덱스가 범위를 벗어나면 0으로 리셋
  useEffect(() => {
    if (currentCategories.length > 0 && selectedCategoryIndex >= currentCategories.length) {
      setSelectedCategoryIndex(0);
    }
  }, [currentCategories.length, selectedCategoryIndex]);

  const handlePrevKeyboard = () => {
    if (availableKeyboardTypes.length === 0 || !selectedKeyboardType) return;
    const currentIndex = availableKeyboardTypes.indexOf(selectedKeyboardType);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableKeyboardTypes.length - 1;
    setSelectedKeyboardType(
      Object.prototype.hasOwnProperty.call(availableKeyboardTypes, prevIndex)
        ? availableKeyboardTypes[prevIndex]
        : availableKeyboardTypes[0]
    );
    setSelectedCategoryIndex(0);
  };

  const handleNextKeyboard = () => {
    if (availableKeyboardTypes.length === 0 || !selectedKeyboardType) return;
    const currentIndex = availableKeyboardTypes.indexOf(selectedKeyboardType);
    const nextIndex = currentIndex < availableKeyboardTypes.length - 1 ? currentIndex + 1 : 0;
    setSelectedKeyboardType(
      Object.prototype.hasOwnProperty.call(availableKeyboardTypes, nextIndex)
        ? availableKeyboardTypes[nextIndex]
        : availableKeyboardTypes[0]
    );
    setSelectedCategoryIndex(0);
  };

  if (!isOpen) return null;

  if (
    !selectedKeyboardType ||
    availableKeyboardTypes.length === 0 ||
    currentCategories.length === 0 ||
    !currentCategory
  ) {
    return createPortal(
      <div className="modal-overlay animate-fade-in" onClick={onClose}>
        <div
          className="modal-base keyboard-info-modal quiz-page animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
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
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-base keyboard-info-modal quiz-page animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="quiz-header">
          <button className="quiz-back-button" onClick={onClose} aria-label="뒤로 가기">
            ←
          </button>
          <div className="quiz-timer-container">
            <h2 className="keyboard-info-modal-title">
              {getKeyboardTypeName(selectedKeyboardType)}
            </h2>
          </div>
        </header>

        <div className="quiz-content keyboard-info-content-wrapper">
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

          <KeyboardPreview
            keyboardType={selectedKeyboardType}
            allowNegative={currentCategory.allowNegative}
          />

          <div className="keyboard-info-preview-indicator">
            레벨 {currentCategory.levels.length > 0 ? `1-${currentCategory.levels.length}` : '없음'}{' '}
            ({currentCategory.levels.length}개)
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
