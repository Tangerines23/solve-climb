import React from 'react';
import { usePreGameLobbyBridge } from '../../hooks/usePreGameLobbyBridge';
import { getItemEmoji, getItemShortEffect } from '@/constants/items';
import './PreGameLobby.css';

interface PreGameLobbyProps {
  onStart: (selectedItems: number[]) => void;
  onBack: () => void;
  category: string;
  topic: string;
}

export const PreGameLobby: React.FC<PreGameLobbyProps> = ({ onStart, onBack, category, topic }) => {
  const { inventory } = usePreGameLobbyBridge();
  const [selectedItemIds, setSelectedItemIds] = React.useState<number[]>([]);

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div className="pre-game-lobby">
      <div className="lobby-content">
        <header className="lobby-header">
          <button className="btn-base btn-ghost back-button" onClick={onBack}>
            ←
          </button>
          <h2>준비하기</h2>
          <div className="game-info">
            {category} - {topic}
          </div>
        </header>

        <section className="inventory-section">
          <h3>아이템 선택</h3>
          <p className="hint">소유한 아이템을 장착하고 출발하세요!</p>

          <div className="lobby-inventory-list">
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <div
                  key={item.id}
                  className={`lobby-item-card ${selectedItemIds.includes(item.id) ? 'selected' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="item-badge">x{item.quantity}</div>
                  <div className="item-emoji">{getItemEmoji(item.code)}</div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-effect-desc">{getItemShortEffect(item.code)}</div>
                </div>
              ))
            ) : (
              <div className="empty-inventory-message">
                <p>보유한 아이템이 없습니다.</p>
                <button
                  className="btn-base btn-secondary go-shop-btn"
                  onClick={() => (window.location.href = '/shop')}
                >
                  상점 가기
                </button>
              </div>
            )}
          </div>
        </section>

        <footer className="lobby-footer">
          <button
            className="btn-base btn-primary start-game-btn"
            onClick={() => onStart(selectedItemIds)}
          >
            등반 시작!
          </button>
        </footer>
      </div>
    </div>
  );
};
