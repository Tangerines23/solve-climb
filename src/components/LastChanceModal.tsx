import { useEffect, useState } from 'react';
import './LastChanceModal.css';

interface LastChanceModalProps {
  isVisible: boolean;
  gameMode: 'survival' | 'time-attack';
  inventoryCount: number;
  userMinerals: number;
  onUseItem: () => void; // 인벤토리 사용
  onPurchaseAndUse: () => void; // 즉시 구매 후 사용
  onGiveUp: () => void;
  basePrice: number; // 원래 가격 (이거의 2배로 계산)
}

export function LastChanceModal({
  isVisible,
  gameMode,
  inventoryCount,
  userMinerals,
  onUseItem,
  onPurchaseAndUse,
  onGiveUp,
  basePrice,
}: LastChanceModalProps) {
  const [timeLeft, setTimeLeft] = useState(10); // 자동 포기 카운트다운 (선택 사항)

  useEffect(() => {
    if (isVisible) {
      setTimeLeft(10);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // onGiveUp 호출은 렌더링 도중이 아닌, 비동기로 처리
            setTimeout(() => onGiveUp(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVisible, onGiveUp]);

  if (!isVisible) return null;

  const itemName =
    gameMode === 'time-attack' ? '라스트 스퍼트 (+15초 + 피버)' : '구조 신호탄 (부활)';
  const itemType = gameMode === 'time-attack' ? 'last_spurt' : 'flare';
  const purchasePrice = basePrice * 2;
  const canAfford = userMinerals >= purchasePrice;

  return (
    <div className="last-chance-overlay">
      <div className="last-chance-modal">
        <div className="last-chance-header">
          <h2>LAST CHANCE!</h2>
          <div className="last-chance-timer">{timeLeft}</div>
        </div>

        <div className="last-chance-content">
          <p className="last-chance-message">
            {gameMode === 'time-attack'
              ? '라스트 스퍼트로 15초 더 뛸 수 있습니다!'
              : '구조 신호탄을 사용하여 부활하시겠습니까?'}
          </p>

          <div className="item-status">
            <div className={`item-icon ${itemType}`}></div>
            <span className="item-name">{itemName}</span>
          </div>

          <div className="action-buttons">
            {inventoryCount > 0 ? (
              <button className="last-chance-btn use-btn" onClick={onUseItem}>
                아이템 사용 (보유: {inventoryCount})
              </button>
            ) : (
              <button
                className={`last-chance-btn buy-btn ${!canAfford ? 'disabled' : ''}`}
                onClick={canAfford ? onPurchaseAndUse : undefined}
                disabled={!canAfford}
              >
                즉시 구매 & 사용 (-{purchasePrice}💎)
                {!canAfford && <span className="error-text">미네랄 부족 ({userMinerals})</span>}
              </button>
            )}

            <button className="last-chance-btn give-up-btn" onClick={onGiveUp}>
              그냥 기록 남기기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
