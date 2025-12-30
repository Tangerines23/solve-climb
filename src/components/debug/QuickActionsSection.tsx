import { useState } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { useDebugStore } from '../../stores/useDebugStore';
import './QuickActionsSection.css';

export function QuickActionsSection() {
  const { minerals, stamina, fetchUserData, setMinerals, setStamina } = useUserStore();
  const { 
    infiniteStamina, 
    infiniteMinerals, 
    infiniteTime,
    setInfiniteStamina,
    setInfiniteMinerals,
    setInfiniteTime
  } = useDebugStore();

  const [staminaInput, setStaminaInput] = useState(stamina.toString());
  const [mineralsInput, setMineralsInput] = useState(minerals.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStaminaChange = async (delta: number) => {
    if (isUpdating) return; // 중복 클릭 방지
    
    setIsUpdating(true);
    try {
      const newValue = Math.max(0, stamina + delta);
      setStaminaInput(newValue.toString());
      setStamina(newValue); // 동기 함수이므로 await 불필요
      await fetchUserData(); // 비동기 함수이므로 await 필요
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStaminaInputChange = (value: string) => {
    setStaminaInput(value);
  };

  const handleStaminaInputBlur = async () => {
    const numValue = parseInt(staminaInput, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setIsUpdating(true);
      await setStamina(numValue);
      await fetchUserData();
      setIsUpdating(false);
    } else {
      setStaminaInput(stamina.toString());
    }
  };

  const handleMineralsChange = async (delta: number) => {
    if (isUpdating) return; // 중복 클릭 방지
    
    setIsUpdating(true);
    try {
      const newValue = Math.max(0, minerals + delta);
      setMineralsInput(newValue.toString());
      await setMinerals(newValue); // 비동기 함수이므로 await 필요
      await fetchUserData(); // 비동기 함수이므로 await 필요
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMineralsInputChange = (value: string) => {
    setMineralsInput(value);
  };

  const handleMineralsInputBlur = async () => {
    const numValue = parseInt(mineralsInput, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setIsUpdating(true);
      await setMinerals(numValue);
      await fetchUserData();
      setIsUpdating(false);
    } else {
      setMineralsInput(minerals.toString());
    }
  };

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">📊 게임 상태</h3>
      
      <div className="debug-resource-control">
        <div className="debug-resource-item">
          <label className="debug-resource-label">스태미나</label>
          <div className="debug-resource-input-group">
            <button 
              className="debug-resource-button"
              onClick={() => handleStaminaChange(-1)}
              disabled={isUpdating}
            >
              -1
            </button>
            <input
              type="number"
              className="debug-resource-input"
              value={staminaInput}
              onChange={(e) => handleStaminaInputChange(e.target.value)}
              onBlur={handleStaminaInputBlur}
              min="0"
              disabled={isUpdating}
            />
            <button 
              className="debug-resource-button"
              onClick={() => handleStaminaChange(1)}
              disabled={isUpdating}
            >
              +1
            </button>
          </div>
        </div>

        <div className="debug-resource-item">
          <label className="debug-resource-label">미네랄</label>
          <div className="debug-resource-input-group">
            <button 
              className="debug-resource-button"
              onClick={() => handleMineralsChange(-100)}
              disabled={isUpdating}
            >
              -100
            </button>
            <input
              type="number"
              className="debug-resource-input"
              value={mineralsInput}
              onChange={(e) => handleMineralsInputChange(e.target.value)}
              onBlur={handleMineralsInputBlur}
              min="0"
              disabled={isUpdating}
            />
            <button 
              className="debug-resource-button"
              onClick={() => handleMineralsChange(100)}
              disabled={isUpdating}
            >
              +100
            </button>
          </div>
        </div>
      </div>

      <div className="debug-infinite-modes">
        <h4 className="debug-subsection-title">무한 모드</h4>
        
        <div className="debug-toggle-item">
          <label className="debug-toggle-label">무한 스태미나</label>
          <button
            className={`debug-toggle-button ${infiniteStamina ? 'active' : ''}`}
            onClick={() => setInfiniteStamina(!infiniteStamina)}
          >
            {infiniteStamina ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="debug-toggle-item">
          <label className="debug-toggle-label">무한 미네랄</label>
          <button
            className={`debug-toggle-button ${infiniteMinerals ? 'active' : ''}`}
            onClick={() => setInfiniteMinerals(!infiniteMinerals)}
          >
            {infiniteMinerals ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="debug-toggle-item">
          <label className="debug-toggle-label">무한 시간</label>
          <button
            className={`debug-toggle-button ${infiniteTime ? 'active' : ''}`}
            onClick={() => setInfiniteTime(!infiniteTime)}
          >
            {infiniteTime ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}

