import { useState, useEffect, useMemo, FormEvent } from 'react';
import { APP_CONFIG } from '@/config/app';
import { useSettingsStore } from '@/stores/useSettingsStore';

export interface KeyboardInfo {
  category: string;
  categoryName: string;
  subTopic: string;
  subTopicName: string;
  icon: string;
  keyboardType: 'qwerty-text' | 'custom' | 'qwerty-number';
  allowNegative: boolean;
  levels: Array<{ level: number; name: string }>;
}

export type KeyboardDisplayType = 'qwerty-text' | 'qwerty-number' | 'custom';

export const useKeyboardInfoModalBridge = (_isOpen: boolean, _onClose: () => void) => {
  const keyboardType = useSettingsStore((state) => state.keyboardType);
  const [isLandscape, setIsLandscape] = useState(false);

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
            ? Reflect.get(levelsConfig, 'World1')
            : undefined;
          const levels =
            (worldLevels && Object.prototype.hasOwnProperty.call(worldLevels, categoryId)
              ? Reflect.get(worldLevels, categoryId)
              : undefined) || [];

          let kbType: 'qwerty-text' | 'custom' | 'qwerty-number' | null = null;
          let allowNegative = false;
          let shouldInclude = false;

          if (type === 'qwerty-text') {
            if (mtnId === 'language' && (categoryId === '히라가나' || categoryId === '가타카나')) {
              kbType = 'qwerty-text';
              shouldInclude = true;
            }
          } else if (type === 'qwerty-number') {
            if (
              keyboardType === 'qwerty' &&
              !(mtnId === 'language' && (categoryId === '히라가나' || categoryId === '가타카나'))
            ) {
              kbType = 'qwerty-number';
              shouldInclude = true;
              if (mtnId === 'math' && (categoryId === '대수' || categoryId === '심화')) {
                allowNegative = true;
              }
            }
          } else if (type === 'custom') {
            if (
              keyboardType === 'custom' &&
              !(mtnId === 'language' && (categoryId === '히라가나' || categoryId === '가타카나'))
            ) {
              kbType = 'custom';
              shouldInclude = true;
              if (mtnId === 'math' && (categoryId === '대수' || categoryId === '심화')) {
                allowNegative = true;
              }
            }
          }

          if (shouldInclude && kbType) {
            categories.push({
              category: mtnId,
              categoryName:
                (Object.prototype.hasOwnProperty.call(APP_CONFIG.MOUNTAIN_MAP, mtnId)
                  ? Reflect.get(APP_CONFIG.MOUNTAIN_MAP, mtnId)
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

  const availableKeyboardTypes = useMemo(() => {
    const types: KeyboardDisplayType[] = [];
    if (getKeyboardTypeInfo('qwerty-text').length > 0) types.push('qwerty-text');
    if (getKeyboardTypeInfo('qwerty-number').length > 0) types.push('qwerty-number');
    if (getKeyboardTypeInfo('custom').length > 0) types.push('custom');
    return types;
  }, [getKeyboardTypeInfo]);

  const [selectedKeyboardType, setSelectedKeyboardType] = useState<KeyboardDisplayType | null>(
    null
  );
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  useEffect(() => {
    if (availableKeyboardTypes.length === 0) {
      setSelectedKeyboardType(null);
    } else if (!selectedKeyboardType || !availableKeyboardTypes.includes(selectedKeyboardType)) {
      let initialType: KeyboardDisplayType | null = null;
      if (keyboardType === 'qwerty' && availableKeyboardTypes.includes('qwerty-number')) {
        initialType = 'qwerty-number';
      } else if (keyboardType === 'custom' && availableKeyboardTypes.includes('custom')) {
        initialType = 'custom';
      } else {
        initialType = availableKeyboardTypes[0];
      }
      setSelectedKeyboardType(initialType);
    }
  }, [availableKeyboardTypes, keyboardType, selectedKeyboardType]);

  useEffect(() => {
    setSelectedCategoryIndex(0);
  }, [selectedKeyboardType, availableKeyboardTypes]);

  useEffect(() => {
    const checkOrientation = () => {
      let landscape = false;
      if (screen.orientation) {
        landscape = screen.orientation.type.includes('landscape');
      } else if (window.matchMedia) {
        landscape = window.matchMedia('(orientation: landscape)').matches;
      } else {
        landscape = window.innerWidth > window.innerHeight;
      }
      setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const currentCategories = useMemo(() => {
    if (!selectedKeyboardType) return [];
    return getKeyboardTypeInfo(selectedKeyboardType);
  }, [selectedKeyboardType, getKeyboardTypeInfo]);

  const currentCategory = useMemo(() => {
    if (currentCategories.length === 0) return null;
    return currentCategories.at(selectedCategoryIndex) || currentCategories.at(0) || null;
  }, [currentCategories, selectedCategoryIndex]);

  const handlePrevKeyboard = () => {
    if (availableKeyboardTypes.length === 0 || !selectedKeyboardType) return;
    const currentIndex = availableKeyboardTypes.indexOf(selectedKeyboardType);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableKeyboardTypes.length - 1;
    const targetType = availableKeyboardTypes.at(prevIndex);
    if (targetType) setSelectedKeyboardType(targetType);
    setSelectedCategoryIndex(0);
  };

  const handleNextKeyboard = () => {
    if (availableKeyboardTypes.length === 0 || !selectedKeyboardType) return;
    const currentIndex = availableKeyboardTypes.indexOf(selectedKeyboardType);
    const nextIndex = currentIndex < availableKeyboardTypes.length - 1 ? currentIndex + 1 : 0;
    const targetType = availableKeyboardTypes.at(nextIndex);
    if (targetType) setSelectedKeyboardType(targetType);
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

  return {
    keyboardType,
    isLandscape,
    availableKeyboardTypes,
    selectedKeyboardType,
    setSelectedKeyboardType,
    selectedCategoryIndex,
    setSelectedCategoryIndex,
    currentCategories,
    currentCategory,
    handlePrevKeyboard,
    handleNextKeyboard,
    getKeyboardTypeName,
    handleKeyPress: () => {},
    handleClear: () => {},
    handleBackspace: () => {},
    handleSubmit: (e: FormEvent) => e.preventDefault(),
  };
};
