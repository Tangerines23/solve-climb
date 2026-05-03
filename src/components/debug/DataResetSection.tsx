import { useState, useEffect } from 'react';
import { useDataResetDebugBridge } from '../../hooks/useDataResetDebugBridge';
import { ConfirmModal } from '../ConfirmModal';
import './DataResetSection.css';

export const DataResetSection = () => {
  const {
    isResetting,
    isDeleting,
    isResettingProgress,
    executeResetProfile,
    executeDeleteRecent,
    executeDeleteAll,
    executeDeleteByLevel,
    executeResetLevelProgress,
    getAvailableCategories,
    getSubjectsForCategory,
    handleExportData,
    handleImportData,
    handleSaveSnapshot,
    handleRestoreSnapshot,
    message,
  } = useDataResetDebugBridge();

  // 게임 기록 초기화 상태
  const [deleteCount, setDeleteCount] = useState('10');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  // 레벨 진행도 초기화 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('math');
  const [selectedSubject, setSelectedSubject] = useState<string>('arithmetic');

  // 컨펌 모달 상태
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleResetProfileClick = (resetType: 'all' | 'score' | 'minerals' | 'tier') => {
    if (isResetting) return;

    setConfirmConfig({
      isOpen: true,
      title: '프로필 초기화',
      message: `프로필을 초기화하시겠습니까? (초기화 항목: ${resetType === 'all' ? '전체' : resetType}) 이 작업은 되돌릴 수 없습니다.`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        await executeResetProfile(resetType);
      },
    });
  };

  const handleDeleteRecentClick = () => {
    if (isDeleting) return;
    const count = parseInt(deleteCount, 10);
    if (isNaN(count) || count <= 0) {
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: '게임 기록 삭제',
      message: `최근 ${count}개의 게임 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        await executeDeleteRecent(count);
      },
    });
  };

  const handleDeleteAllClick = () => {
    if (isDeleting) return;

    setConfirmConfig({
      isOpen: true,
      title: '전체 기록 삭제',
      message: '모든 게임 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        await executeDeleteAll();
      },
    });
  };

  const handleDeleteByLevelClick = async () => {
    if (isDeleting || selectedLevel === null) return;
    
    setConfirmConfig({
      isOpen: true,
      title: '레벨 기록 삭제',
      message: `레벨 ${selectedLevel}의 모든 게임 기록을 삭제하시겠습니까?`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        await executeDeleteByLevel(selectedLevel);
      },
    });
  };

  const handleResetLevelProgressClick = async () => {
    if (isResettingProgress) return;
    
    const categoryName = getAvailableCategories().find(c => c.id === selectedCategory)?.name || selectedCategory;

    setConfirmConfig({
      isOpen: true,
      title: '레벨 진행도 초기화',
      message: `${categoryName} > ${selectedSubject}의 레벨 진행도를 초기화하시겠습니까?`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        await executeResetLevelProgress(selectedCategory, selectedSubject);
      },
    });
  };

  // 카테고리 변경 시 주제 초기화
  useEffect(() => {
    const subjects = getSubjectsForCategory(selectedCategory);
    if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
      setSelectedSubject(subjects[0]);
    }
  }, [selectedCategory, selectedSubject, getSubjectsForCategory]);

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">💾 데이터 관리</h3>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">프로필 초기화</h4>
        <div className="debug-reset-buttons">
          <button
            className="debug-reset-button debug-reset-button-score"
            onClick={() => handleResetProfileClick('score')}
            disabled={isResetting}
          >
            점수만
          </button>
          <button
            className="debug-reset-button debug-reset-button-minerals"
            onClick={() => handleResetProfileClick('minerals')}
            disabled={isResetting}
          >
            미네랄만
          </button>
          <button
            className="debug-reset-button debug-reset-button-tier"
            onClick={() => handleResetProfileClick('tier')}
            disabled={isResetting}
          >
            티어만
          </button>
          <button
            className="debug-reset-button debug-reset-button-all"
            onClick={() => handleResetProfileClick('all')}
            disabled={isResetting}
          >
            전체
          </button>
        </div>
      </div>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">상태 내보내기/가져오기</h4>
        <div className="debug-export-buttons">
          <button className="debug-export-button" onClick={handleExportData}>
            JSON 다운로드
          </button>
          <button className="debug-export-button" onClick={handleImportData}>
            JSON 가져오기
          </button>
        </div>
      </div>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">스냅샷</h4>
        <div className="debug-snapshot-buttons">
          <button className="debug-snapshot-button" onClick={handleSaveSnapshot}>
            저장
          </button>
          <button className="debug-snapshot-button" onClick={handleRestoreSnapshot}>
            복원
          </button>
        </div>
      </div>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">게임 기록 초기화</h4>

        <div className="debug-game-records-delete">
          <div className="debug-game-records-row">
            <label htmlFor="debug-delete-count-input" className="debug-game-records-label">
              최근 N개 삭제:
            </label>
            <input
              type="number"
              id="debug-delete-count-input"
              name="deleteCount"
              className="debug-game-records-input"
              value={deleteCount}
              onChange={(e) => setDeleteCount(e.target.value)}
              min="1"
              disabled={isDeleting}
            />
            <button
              className="debug-game-records-button"
              onClick={handleDeleteRecentClick}
              disabled={isDeleting}
            >
              삭제
            </button>
          </div>

          <div className="debug-game-records-row">
            <button
              className="debug-game-records-button debug-game-records-button-danger"
              onClick={handleDeleteAllClick}
              disabled={isDeleting}
            >
              전체 삭제
            </button>
          </div>

          <div className="debug-game-records-row">
            <label htmlFor="debug-level-select" className="debug-game-records-label">
              레벨 선택:
            </label>
            <select
              id="debug-level-select"
              name="selectedLevel"
              className="debug-game-records-select"
              value={selectedLevel === null ? '' : selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value === '' ? null : parseInt(e.target.value, 10))
              }
              disabled={isDeleting}
            >
              <option value="">레벨 선택</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => (
                <option key={level} value={level}>
                  레벨 {level}
                </option>
              ))}
            </select>
            <button
              className="debug-game-records-button"
              onClick={handleDeleteByLevelClick}
              disabled={isDeleting || selectedLevel === null}
            >
              레벨 삭제
            </button>
          </div>
        </div>
      </div>

      <div className="debug-data-section">
        <h4 className="debug-subsection-title">레벨 진행도 초기화</h4>
        <div className="debug-level-progress-reset">
          <div className="debug-level-progress-row">
            <label htmlFor="debug-category-select" className="debug-level-progress-label">
              카테고리:
            </label>
            <select
              id="debug-category-select"
              name="selectedCategory"
              className="debug-level-progress-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isResettingProgress}
            >
              {getAvailableCategories().map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="debug-level-progress-row">
            <label htmlFor="debug-subject-select" className="debug-level-progress-label">
              주제:
            </label>
            <select
              id="debug-subject-select"
              name="selectedSubject"
              className="debug-level-progress-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isResettingProgress}
            >
              {getSubjectsForCategory(selectedCategory).map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div className="debug-level-progress-row">
            <button
              className="debug-level-progress-button"
              onClick={handleResetLevelProgressClick}
              disabled={isResettingProgress}
            >
              진행도 초기화
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>{message.text}</div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
    </div>
  );
};
