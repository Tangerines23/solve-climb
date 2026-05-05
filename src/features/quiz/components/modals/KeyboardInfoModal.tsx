import { createPortal } from 'react-dom';
import { useKeyboardInfoModalBridge, KeyboardInfo } from '../../hooks/bridge/useKeyboardInfoModalBridge';
import { CustomKeypad } from '../input/CustomKeypad';
import { QwertyKeypad } from '../input/QwertyKeypad';
import '../../pages/QuizPage.css';
import './KeyboardInfoModal.css';

interface KeyboardInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardInfoModal({ isOpen, onClose }: KeyboardInfoModalProps) {
  const {
    availableKeyboardTypes,
    selectedKeyboardType,
    selectedCategoryIndex,
    setSelectedCategoryIndex,
    currentCategories,
    currentCategory,
    handlePrevKeyboard,
    handleNextKeyboard,
    getKeyboardTypeName,
    handleKeyPress,
    handleClear,
    handleBackspace,
    handleSubmit
  } = useKeyboardInfoModalBridge(isOpen, onClose);

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
        </div>
      );
    }

    return (
      <div className="modal-overlay animate-fade-in" onClick={onClose}>
        <div
          className="modal-base keyboard-info-modal quiz-page animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
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
                {currentCategories.map((info: KeyboardInfo, index: number) => (
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
