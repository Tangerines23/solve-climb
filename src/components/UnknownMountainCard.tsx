import React, { useState, useRef } from 'react';
import './UnknownMountainCard.css';

const explorerMessages = [
  "아직 지도에 표시되지 않은 구역이에요! 🗺️",
  "이 산은 아직 구름 속에 가려져 있어요 ☁️",
  "안개가 걷히면 등반할 수 있어요! 🌫️",
  "아직 누구도 정복하지 못한 미개척지예요 🚩",
  "셰르파들이 안전한 길을 찾는 중입니다 🧗",
  "이곳의 좌표는 아직 비밀에 부쳐져 있어요 🤫",
  "나침반이 방향을 찾지 못하고 빙글빙글 도네요 🧭",
  "전설 속에만 존재하는 신비의 산입니다 ✨",
  "베이스캠프에서 장비를 점검하고 있어요 🎒",
  "곧 입산 통제가 해제될 예정입니다 🚧"
];

interface UnknownMountainCardProps {
  onToast?: (message: string) => void;
}

export function UnknownMountainCard({ onToast }: UnknownMountainCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const lastClickTimeRef = useRef<number>(0);
  const CLICK_COOLDOWN = 500; // 0.5초 쿨다운

  const handleClick = () => {
    const now = Date.now();
    // 쿨다운 시간이 지나지 않았으면 클릭 무시
    if (now - lastClickTimeRef.current < CLICK_COOLDOWN) {
      return;
    }
    
    lastClickTimeRef.current = now;
    
    // 랜덤 메시지 선택
    const randomMessage = explorerMessages[Math.floor(Math.random() * explorerMessages.length)];
    
    if (onToast) {
      onToast(randomMessage);
    }
  };

  return (
    <div
      className={`unknown-mountain-card ${isPressed ? 'pressed' : ''}`}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div className="unknown-mountain-content">
        <div className="unknown-mountain-icon-wrapper">
          <svg
            className="unknown-mountain-icon"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 산 실루엣 (뒤) */}
            <path
              d="M20 80 L35 50 L50 60 L65 45 L80 70 L80 100 L20 100 Z"
              fill="#9CA3AF"
              opacity="0.6"
            />
            {/* 구름 (앞) */}
            <ellipse cx="30" cy="45" rx="15" ry="8" fill="#9CA3AF" opacity="0.8" />
            <ellipse cx="40" cy="42" rx="12" ry="6" fill="#9CA3AF" opacity="0.8" />
            <ellipse cx="50" cy="50" rx="18" ry="10" fill="#9CA3AF" opacity="0.8" />
            <ellipse cx="60" cy="48" rx="14" ry="7" fill="#9CA3AF" opacity="0.8" />
            <ellipse cx="70" cy="52" rx="16" ry="9" fill="#9CA3AF" opacity="0.8" />
          </svg>
        </div>
        <div className="unknown-mountain-text">
          <h3 className="unknown-mountain-title">미지의 산</h3>
          <p className="unknown-mountain-description">베이스캠프 구축 중</p>
          <button className="unknown-mountain-button">⛏️ 개척 중</button>
        </div>
      </div>
    </div>
  );
}

