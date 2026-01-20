import React, { useState } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import { APP_CONFIG } from '../../config/app';
import { useNavigate } from 'react-router-dom';
import './ProgressionSection.css';

export const ProgressionSection = React.memo(function ProgressionSection() {
  const { bypassLevelLock, setBypassLevelLock } = useDebugStore();
  const navigate = useNavigate();

  const [selectedWorld, setSelectedWorld] = useState<string>(APP_CONFIG.WORLDS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    APP_CONFIG.WORLDS[0].mountainId === 'math' ? '기초' : '히라가나'
  );
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const worlds = APP_CONFIG.WORLDS;
  const categories = APP_CONFIG.CATEGORIES.filter(
    (c) => c.mountainId === worlds.find((w) => w.id === selectedWorld)?.mountainId
  );

  // 현재 선택된 월드/카테고리에 해당하는 레벨 목록 가져오기
  const worldLevels = APP_CONFIG.LEVELS[selectedWorld as keyof typeof APP_CONFIG.LEVELS];
  const levels =
    (worldLevels as unknown as Record<string, readonly unknown[]>)?.[selectedCategory] || [];

  const handleTeleport = () => {
    const worldName = selectedWorld;
    const categoryName = selectedCategory;
    const levelNum = selectedLevel;

    // /quiz?mountain=math&world=World1&category=기초&level=1&mode=survival
    const mountainId = worlds.find((w) => w.id === worldName)?.mountainId || 'math';
    navigate(
      `/quiz?mountain=${mountainId}&world=${worldName}&category=${categoryName}&level=${levelNum}&mode=survival`
    );

    // 디버그 패널 닫기 (이건 useDebugStore의 toggleDebugPanel을 호출해야 함)
    // 하지만 일단은 이동만 수행
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">🏆 진행 및 자유 이동</h3>

      <div className="debug-progression-control">
        <div className="debug-progression-item">
          <div className="debug-progression-info">
            <span className="debug-progression-label">모든 레벨 해금 (Bypass)</span>
            <span className="debug-progression-desc">
              클리어 여부와 상관없이 모든 레벨 진입 가능
            </span>
          </div>
          <button
            className={`debug-toggle-button ${bypassLevelLock ? 'active' : ''}`}
            onClick={() => setBypassLevelLock(!bypassLevelLock)}
          >
            {bypassLevelLock ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="debug-teleport-zone">
          <h4 className="debug-subtitle">📍 레벨 즉시 이동 (Teleport)</h4>

          <div className="debug-teleport-selects">
            <div className="debug-select-group">
              <label>월드</label>
              <select
                value={selectedWorld}
                onChange={(e) => {
                  setSelectedWorld(e.target.value);
                  // 카테고리 초기화
                  const firstCat = APP_CONFIG.CATEGORIES.find(
                    (c) => c.mountainId === worlds.find((w) => w.id === e.target.value)?.mountainId
                  )?.id;
                  if (firstCat) setSelectedCategory(firstCat);
                  setSelectedLevel(1);
                }}
              >
                {worlds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="debug-select-group">
              <label>분야</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedLevel(1);
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="debug-select-group">
              <label>레벨</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
              >
                {(levels as ReadonlyArray<{ level: number; name: string }>).map((l) => (
                  <option key={l.level} value={l.level}>
                    Lv.{l.level} - {l.name}
                  </option>
                ))}
                {levels.length === 0 && <option value={1}>레벨 데이터 없음</option>}
              </select>
            </div>
          </div>

          <button className="debug-teleport-button" onClick={handleTeleport}>
            지금 바로 이동하기 🚀
          </button>
        </div>
      </div>
    </div>
  );
});
