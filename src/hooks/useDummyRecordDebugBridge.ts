import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useUserStore } from '../stores/useUserStore';

export const WORLDS = [
  { id: 'World1', name: 'World 1: 기초 탐험' },
  { id: 'World2', name: 'World 2: 도형과 공간' },
  { id: 'World3', name: 'World 3: 확률과 통계' },
  { id: 'World4', name: 'World 4: 공학 및 응용' },
  { id: 'LangWorld1', name: 'Lang World 1: 일본어 시작' },
];

export const CATEGORIES = [
  { id: 'math', name: '수학' },
  { id: 'language', name: '언어' },
  { id: 'logic', name: '논리' },
];

export const SUBJECTS: Record<string, { id: string; name: string }[]> = {
  math: [
    { id: 'add', name: '덧셈' },
    { id: 'sub', name: '뺄셈' },
    { id: 'mul', name: '곱셈' },
    { id: 'div', name: '나눗셈' },
    { id: 'arithmetic', name: '사칙연산' },
    { id: 'equations', name: '방정식' },
  ],
  language: [
    { id: 'word', name: '기초 어휘' },
    { id: 'hiragana', name: '히라가나' },
    { id: 'katakana', name: '가타카나' },
  ],
  logic: [{ id: 'puzzle', name: '논리 퍼즐' }],
};

export const MODES = [
  { id: 'timeattack', name: '타임어택' },
  { id: 'survival', name: '서바이벌' },
];

export function useDummyRecordDebugBridge() {
  const { fetchUserData } = useUserStore();
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedWorldId, setSelectedWorldId] = useState(WORLDS[0].id);
  const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES[0].id);
  const [selectedSubjectId, setSelectedSubjectId] = useState(SUBJECTS['math'][0].id);
  const [selectedMode] = useState(MODES[0].id);
  const [level, setLevel] = useState(1);
  const [correctCount, setCorrectCount] = useState(10);
  const [avgCombo, setAvgCombo] = useState(0); // 0: None, 1: Fever, 2: Super Fever
  const [iterations, setIterations] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setTargetUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    const subjects = SUBJECTS[selectedCategoryId] || [];
    if (subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [selectedCategoryId]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setIsSubmitting(true);
      setMessage(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('로그인이 필요합니다.');

        const { data, error } = await supabase.rpc('debug_run_play_scenario', {
          p_user_id: targetUserId || session.user.id,
          p_world_id: selectedWorldId,
          p_category_id: selectedCategoryId,
          p_subject_id: selectedSubjectId,
          p_level: level,
          p_avg_correct: correctCount,
          p_avg_combo: avgCombo,
          p_iterations: iterations,
          p_game_mode: selectedMode,
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || '생성 실패');

        setMessage({
          type: 'success',
          text: `시뮬레이션 완료! [${selectedWorldId}] ${selectedSubjectId} Lv.${level} 플레이 ${iterations}회 반영됨.`,
        });

        if ((targetUserId || session.user.id) === session.user.id) {
          await fetchUserData();
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      targetUserId,
      selectedWorldId,
      selectedCategoryId,
      selectedSubjectId,
      level,
      correctCount,
      avgCombo,
      iterations,
      selectedMode,
      fetchUserData,
    ]
  );

  return {
    targetUserId,
    setTargetUserId,
    selectedWorldId,
    setSelectedWorldId,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedMode,
    level,
    setLevel,
    correctCount,
    setCorrectCount,
    avgCombo,
    setAvgCombo,
    iterations,
    setIterations,
    isSubmitting,
    message,
    handleSubmit,
    worlds: WORLDS,
    categories: CATEGORIES,
    subjects: SUBJECTS[selectedCategoryId] || [],
  };
}
