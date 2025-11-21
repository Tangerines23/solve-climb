import React from 'react';
import { HIRAGANA_MAPPINGS } from '../utils/japanese';
import './GameTipModal.css';

interface GameTipModalProps {
  isOpen: boolean;
  category: string;
  subTopic: string;
  onClose: () => void;
}

export function GameTipModal({ isOpen, category, subTopic, onClose }: GameTipModalProps) {
  if (!isOpen) return null;

  const renderTip = () => {
    // 방정식 팁
    if (category === 'math' && subTopic === 'equations') {
      return (
        <div className="game-tip-content">
          <h3 className="game-tip-title">💡 방정식 풀이 팁</h3>
          <div className="game-tip-section">
            <h4>일차 방정식 (x + a = b)</h4>
            <p>양변에서 같은 수를 빼거나 더해서 x를 구하세요.</p>
            <div className="game-tip-example">
              <p><strong>예시:</strong> x + 5 = 10</p>
              <p>→ 양변에서 5를 빼면: x = 10 - 5 = 5</p>
            </div>
          </div>
          <div className="game-tip-section">
            <h4>일차 방정식 (ax + b = c)</h4>
            <p>먼저 상수항을 옮기고, x의 계수로 나누세요.</p>
            <div className="game-tip-example">
              <p><strong>예시:</strong> 2x + 3 = 11</p>
              <p>→ 2x = 11 - 3 = 8</p>
              <p>→ x = 8 ÷ 2 = 4</p>
            </div>
          </div>
          <div className="game-tip-section">
            <h4>이차 방정식 (x² = a)</h4>
            <p>제곱근을 구하세요. 양수 해만 답으로 입력하세요.</p>
            <div className="game-tip-example">
              <p><strong>예시:</strong> x² = 16</p>
              <p>→ x = 4 (양수 해만)</p>
            </div>
          </div>
          <div className="game-tip-section">
            <h4>연립 방정식</h4>
            <p>두 방정식을 더하거나 빼서 한 미지수를 제거하세요.</p>
            <div className="game-tip-example">
              <p><strong>예시:</strong> x + y = 10, x - y = 2</p>
              <p>→ 두 식을 더하면: 2x = 12, x = 6</p>
            </div>
          </div>
        </div>
      );
    }

    // 히라가나 팁
    if (category === 'language' && subTopic === 'japanese') {
      // 기본 히라가나만 표시 (탁음, 반탁음 제외)
      const basicHiragana = HIRAGANA_MAPPINGS.filter(m => {
        const romaji = m.romaji;
        return romaji.length <= 2; // 기본 문자만
      });

      // 행별로 그룹화 (a, i, u, e, o 순서)
      const rows = ['a', 'i', 'u', 'e', 'o'];
      const consonants = ['k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w'];
      const grouped: Array<{ row: string; items: typeof basicHiragana }> = [];

      // 모음 행 (a, i, u, e, o)
      rows.forEach(vowel => {
        const items = basicHiragana.filter(m => m.romaji === vowel);
        if (items.length > 0) {
          grouped.push({ row: vowel, items });
        }
      });

      // 자음 행 (ka, ki, ku, ke, ko 등)
      consonants.forEach(consonant => {
        const items = basicHiragana.filter(m => {
          if (m.romaji.length !== 2) return false;
          return m.romaji.startsWith(consonant);
        });
        if (items.length > 0) {
          grouped.push({ row: consonant, items });
        }
      });

      return (
        <div className="game-tip-content">
          <h3 className="game-tip-title">💡 히라가나 표</h3>
          <p className="game-tip-description">히라가나를 보고 로마지(영문자)로 입력하세요.</p>
          <div className="hiragana-table-container">
            {grouped.map((group, groupIndex) => (
              <div key={groupIndex} className="hiragana-row-group">
                <div className="hiragana-row-header">{group.row.toUpperCase()}행</div>
                <div className="hiragana-row-items">
                  {group.items.map((mapping, index) => (
                    <div key={index} className="hiragana-item">
                      <span className="hiragana-char">{mapping.hiragana}</span>
                      <span className="romaji-char">{mapping.romaji}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 기본 팁 (다른 카테고리)
    return (
      <div className="game-tip-content">
        <h3 className="game-tip-title">💡 게임 팁</h3>
        <p>문제를 빠르고 정확하게 풀어보세요!</p>
      </div>
    );
  };

  return (
    <div className="game-tip-modal-overlay" onClick={onClose}>
      <div className="game-tip-modal" onClick={(e) => e.stopPropagation()}>
        {renderTip()}
        <button className="game-tip-close-button" onClick={onClose}>
          시작하기
        </button>
      </div>
    </div>
  );
}

