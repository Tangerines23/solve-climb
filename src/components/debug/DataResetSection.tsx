import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useMyPageStats } from '../../hooks/useMyPageStats';
import { useUserStore } from '../../stores/useUserStore';
import { APP_CONFIG } from '../../config/app';
import './DataResetSection.css';

export const DataResetSection = React.memo(function DataResetSection() {
  const { stats, refetch } = useMyPageStats();
  const { fetchUserData } = useUserStore();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 게임 기록 초기화 상태
  const [deleteCount, setDeleteCount] = useState('10');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 레벨 진행도 초기화 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('math');
  const [selectedSubject, setSelectedSubject] = useState<string>('arithmetic');
  const [isResettingProgress, setIsResettingProgress] = useState(false);

  const handleResetProfile = async (resetType: 'all' | 'score' | 'minerals' | 'tier') => {
    if (isResetting) return;
    if (!confirm(`프로필을 초기화하시겠습니까? (타입: ${resetType})`)) return;

    try {
      setIsResetting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const { error } = await supabase.rpc('debug_reset_profile', {
        p_user_id: user.id,
        p_reset_type: resetType,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '프로필이 초기화되었습니다.' });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = {
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solve-climb-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: '데이터가 내보내졌습니다.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `내보내기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          setIsResetting(true);
          setMessage(null);

          const data = JSON.parse(event.target?.result as string);

          if (!data.stats) {
            setMessage({ type: 'error', text: '유효하지 않은 데이터 형식입니다.' });
            setIsResetting(false);
            return;
          }

          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.user) {
            setMessage({ type: 'error', text: '로그인이 필요합니다.' });
            setIsResetting(false);
            return;
          }
          const user = session.user;

          // 실제 데이터 적용
          const updatePromises: Promise<unknown>[] = [];

          // 마스터리 점수 적용
          if (data.stats.totalMasteryScore !== undefined) {
            updatePromises.push(
              supabase.rpc('debug_set_mastery_score', {
                p_user_id: user.id,
                p_score: data.stats.totalMasteryScore,
              }) as unknown as Promise<unknown>
            );
          }

          // 티어 레벨 적용
          if (data.stats.currentTierLevel !== undefined && data.stats.currentTierLevel !== null) {
            updatePromises.push(
              supabase.rpc('debug_set_tier', {
                p_user_id: user.id,
                p_level: data.stats.currentTierLevel,
              }) as unknown as Promise<unknown>
            );
          }

          // 모든 업데이트 실행
          const results = await Promise.allSettled(updatePromises);

          // 에러 확인
          const errors = results.filter((r) => r.status === 'rejected');
          if (errors.length > 0) {
            const errorMessages = errors
              .map((e) => (e.status === 'rejected' ? e.reason?.message || '알 수 없는 오류' : ''))
              .join(', ');
            setMessage({ type: 'error', text: `일부 데이터 적용 실패: ${errorMessages}` });
          } else {
            setMessage({ type: 'success', text: '데이터가 가져와져 적용되었습니다.' });
            await Promise.all([refetch(), fetchUserData()]);
          }
        } catch (err) {
          setMessage({
            type: 'error',
            text: `가져오기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
          });
        } finally {
          setIsResetting(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveSnapshot = () => {
    try {
      const snapshot = {
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('debug_snapshot', JSON.stringify(snapshot));
      setMessage({ type: 'success', text: '스냅샷이 저장되었습니다.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `스냅샷 저장 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    }
  };

  const handleRestoreSnapshot = async () => {
    try {
      setIsResetting(true);
      setMessage(null);

      const snapshotStr = localStorage.getItem('debug_snapshot');
      if (!snapshotStr) {
        setMessage({ type: 'error', text: '저장된 스냅샷이 없습니다.' });
        setIsResetting(false);
        return;
      }

      const snapshot = JSON.parse(snapshotStr);

      if (!snapshot.stats) {
        setMessage({ type: 'error', text: '유효하지 않은 스냅샷 형식입니다.' });
        setIsResetting(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        setIsResetting(false);
        return;
      }
      const user = session.user;

      // 실제 데이터 적용 (JSON 가져오기와 동일한 로직)
      const updatePromises: Promise<unknown>[] = [];

      if (snapshot.stats.totalMasteryScore !== undefined) {
        updatePromises.push(
          supabase.rpc('debug_set_mastery_score', {
            p_user_id: user.id,
            p_score: snapshot.stats.totalMasteryScore,
          }) as unknown as Promise<unknown>
        );
      }

      if (
        snapshot.stats.currentTierLevel !== undefined &&
        snapshot.stats.currentTierLevel !== null
      ) {
        updatePromises.push(
          supabase.rpc('debug_set_tier', {
            p_user_id: user.id,
            p_level: snapshot.stats.currentTierLevel,
          }) as unknown as Promise<unknown>
        );
      }

      const results = await Promise.allSettled(updatePromises);

      const errors = results.filter((r) => r.status === 'rejected');
      if (errors.length > 0) {
        const errorMessages = errors
          .map((e) => (e.status === 'rejected' ? e.reason?.message || '알 수 없는 오류' : ''))
          .join(', ');
        setMessage({ type: 'error', text: `일부 데이터 복원 실패: ${errorMessages}` });
      } else {
        setMessage({ type: 'success', text: '스냅샷이 복원되었습니다.' });
        await Promise.all([refetch(), fetchUserData()]);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `스냅샷 복원 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsResetting(false);
    }
  };

  // 게임 기록 초기화 함수들
  const handleDeleteRecent = async () => {
    if (isDeleting) return;
    const count = parseInt(deleteCount, 10);
    if (isNaN(count) || count <= 0) {
      setMessage({ type: 'error', text: '유효한 개수를 입력하세요.' });
      return;
    }
    if (!confirm(`최근 ${count}개의 게임 기록을 삭제하시겠습니까?`)) return;

    try {
      setIsDeleting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      // 최근 N개 세션 ID 조회
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(count);

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        setMessage({ type: 'error', text: '삭제할 게임 기록이 없습니다.' });
        return;
      }

      const sessionIds = sessions.map((s) => s.id);

      // game_results 삭제
      const { error: resultsError } = await supabase
        .from('game_results')
        .delete()
        .in('session_id', sessionIds);

      if (resultsError) throw resultsError;

      // game_sessions 삭제
      const { error: sessionsDeleteError } = await supabase
        .from('game_sessions')
        .delete()
        .in('id', sessionIds);

      if (sessionsDeleteError) throw sessionsDeleteError;

      setMessage({ type: 'success', text: `${sessions.length}개의 게임 기록이 삭제되었습니다.` });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (isDeleting) return;
    if (!confirm('모든 게임 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      setIsDeleting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      // game_results 삭제
      const { error: resultsError } = await supabase
        .from('game_results')
        .delete()
        .eq('user_id', user.id);

      if (resultsError) throw resultsError;

      // game_sessions 삭제
      const { error: sessionsError } = await supabase
        .from('game_sessions')
        .delete()
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      setMessage({ type: 'success', text: '모든 게임 기록이 삭제되었습니다.' });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteByLevel = async () => {
    if (isDeleting || selectedLevel === null) return;
    if (!confirm(`레벨 ${selectedLevel}의 모든 게임 기록을 삭제하시겠습니까?`)) return;

    try {
      setIsDeleting(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      // 해당 레벨의 세션 ID 조회
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('level', selectedLevel);

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        setMessage({ type: 'error', text: '삭제할 게임 기록이 없습니다.' });
        return;
      }

      const sessionIds = sessions.map((s) => s.id);

      // game_results 삭제
      const { error: resultsError } = await supabase
        .from('game_results')
        .delete()
        .in('session_id', sessionIds);

      if (resultsError) throw resultsError;

      // game_sessions 삭제
      const { error: sessionsDeleteError } = await supabase
        .from('game_sessions')
        .delete()
        .in('id', sessionIds);

      if (sessionsDeleteError) throw sessionsDeleteError;

      // user_level_records 삭제 (해당 레벨)
      const { error: recordsError } = await supabase
        .from('user_level_records')
        .delete()
        .eq('user_id', user.id)
        .eq('level', selectedLevel);

      if (recordsError) throw recordsError;

      setMessage({ type: 'success', text: `레벨 ${selectedLevel}의 게임 기록이 삭제되었습니다.` });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 카테고리별 주제 목록 반환
  const getSubjectsForCategory = useCallback((category: string): string[] => {
    const subTopics = APP_CONFIG.SUB_TOPICS[category as keyof typeof APP_CONFIG.SUB_TOPICS];
    if (!subTopics) return [];
    return subTopics.map((topic) => topic.id);
  }, []);

  // 레벨 진행도 초기화
  const handleResetLevelProgress = async () => {
    if (isResettingProgress) return;
    if (
      !confirm(
        `${APP_CONFIG.CATEGORY_MAP[selectedCategory as keyof typeof APP_CONFIG.CATEGORY_MAP]} > ${selectedSubject}의 레벨 진행도를 초기화하시겠습니까?`
      )
    )
      return;

    try {
      setIsResettingProgress(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      // user_level_records에서 해당 카테고리와 주제의 레벨 진행도 삭제
      const { error: recordsError } = await supabase
        .from('user_level_records')
        .delete()
        .eq('user_id', user.id)
        .eq('category', selectedCategory)
        .eq('subject', selectedSubject);

      if (recordsError) throw recordsError;

      setMessage({ type: 'success', text: '레벨 진행도가 초기화되었습니다.' });
      await Promise.all([refetch(), fetchUserData()]);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsResettingProgress(false);
    }
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
            onClick={() => handleResetProfile('score')}
            disabled={isResetting}
          >
            점수만
          </button>
          <button
            className="debug-reset-button debug-reset-button-minerals"
            onClick={() => handleResetProfile('minerals')}
            disabled={isResetting}
          >
            미네랄만
          </button>
          <button
            className="debug-reset-button debug-reset-button-tier"
            onClick={() => handleResetProfile('tier')}
            disabled={isResetting}
          >
            티어만
          </button>
          <button
            className="debug-reset-button debug-reset-button-all"
            onClick={() => handleResetProfile('all')}
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
            <label className="debug-game-records-label">최근 N개 삭제:</label>
            <input
              type="number"
              className="debug-game-records-input"
              value={deleteCount}
              onChange={(e) => setDeleteCount(e.target.value)}
              min="1"
              disabled={isDeleting}
            />
            <button
              className="debug-game-records-button"
              onClick={handleDeleteRecent}
              disabled={isDeleting}
            >
              삭제
            </button>
          </div>

          <div className="debug-game-records-row">
            <button
              className="debug-game-records-button debug-game-records-button-danger"
              onClick={handleDeleteAll}
              disabled={isDeleting}
            >
              전체 삭제
            </button>
          </div>

          <div className="debug-game-records-row">
            <label className="debug-game-records-label">레벨 선택:</label>
            <select
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
              onClick={handleDeleteByLevel}
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
            <label className="debug-level-progress-label">카테고리:</label>
            <select
              className="debug-level-progress-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isResettingProgress}
            >
              <option value="math">수학</option>
              <option value="language">언어</option>
              <option value="logic">논리</option>
              <option value="general">상식</option>
            </select>
          </div>
          <div className="debug-level-progress-row">
            <label className="debug-level-progress-label">주제:</label>
            <select
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
              onClick={handleResetLevelProgress}
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
    </div>
  );
});
