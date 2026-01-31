import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useUserStore } from '../../stores/useUserStore';
import './DummyRecordSection.css';

const WORLDS = [
  { id: 'World1', name: 'World 1: 기초 탐험' },
  { id: 'World2', name: 'World 2: 도형과 공간' },
  { id: 'World3', name: 'World 3: 확률과 통계' },
  { id: 'World4', name: 'World 4: 공학 및 응용' },
  { id: 'LangWorld1', name: 'Lang World 1: 일본어 시작' },
];

const CATEGORIES = [
  { id: 'math', name: '수학' },
  { id: 'language', name: '언어' },
  { id: 'logic', name: '논리' },
];

const SUBJECTS: Record<string, { id: string; name: string }[]> = {
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

const MODES = [
  { id: 'timeattack', name: '타임어택' },
  { id: 'survival', name: '서바이벌' },
];

export function DummyRecordSection() {
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

  // 초기 유저 ID 로드
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setTargetUserId(session.user.id);
    });
  }, []);

  // 카테고리 변경 시 서브젝트 초기화
  useEffect(() => {
    if (Object.prototype.hasOwnProperty.call(SUBJECTS, selectedCategoryId)) {
      // eslint-disable-next-line security/detect-object-injection -- key validated above
      const subjects = SUBJECTS[selectedCategoryId];
      if (Array.isArray(subjects) && subjects.length > 0) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [selectedCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="debug-section dummy-record-section">
      <h3 className="debug-section-title">🎭 World 기반 시나리오 시뮬레이터</h3>
      <p className="debug-section-desc">
        정규화된 World/Subject 계층 구조를 기반으로 정밀한 플레이 시뮬레이션을 수행합니다.
      </p>

      <form className="dummy-form" onSubmit={handleSubmit}>
        <div className="dummy-field">
          <label>대상 유저 UUID (비어있으면 본인)</label>
          <input
            type="text"
            placeholder="User ID (UUID)"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="dummy-field">
          <label>월드 (World) 선택</label>
          <select
            value={selectedWorldId}
            onChange={(e) => setSelectedWorldId(e.target.value)}
            disabled={isSubmitting}
          >
            {WORLDS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-small-alt)' }}>
          <div className="dummy-field" style={{ flex: 1 }}>
            <label>카테고리</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={isSubmitting}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="dummy-field" style={{ flex: 1 }}>
            <label>주제 (Subject)</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={isSubmitting}
            >
              {(Object.prototype.hasOwnProperty.call(SUBJECTS, selectedCategoryId)
                ? // eslint-disable-next-line security/detect-object-injection -- key validated above
                  SUBJECTS[selectedCategoryId]
                : []
              ).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-small-alt)' }}>
          <div className="dummy-field" style={{ flex: 1 }}>
            <label>레벨 (1~15)</label>
            <input
              type="number"
              min="1"
              max="15"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
            />
          </div>
          <div className="dummy-field" style={{ flex: 1 }}>
            <label>평균 정답 수 (0~10)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={correctCount}
              onChange={(e) => setCorrectCount(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-small-alt)' }}>
          <div className="dummy-field" style={{ flex: 1 }}>
            <label>평균 콤보 수준</label>
            <select
              value={avgCombo}
              onChange={(e) => setAvgCombo(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
            >
              <option value={0}>기본 (1.0x)</option>
              <option value={1}>Fever (1.2x)</option>
              <option value={2}>Super Fever (1.5x)</option>
            </select>
          </div>
          <div className="dummy-field" style={{ flex: 1 }}>
            <label>반복 횟수 (회차)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button type="submit" className="dummy-submit-button" disabled={isSubmitting}>
          {isSubmitting ? '시뮬레이션 실행 중...' : '시뮬레이션 실행 (New Hierarchy 반영)'}
        </button>

        {message && <div className={`dummy-message ${message.type}`}>{message.text}</div>}
      </form>
    </div>
  );
}
