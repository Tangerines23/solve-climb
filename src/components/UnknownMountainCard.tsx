import { useRef } from 'react';
import { BaseCard } from './BaseCard';
import './UnknownMountainCard.css';

const explorerMessages = [
  '아직 지도에 표시되지 않은 미개척 구역이에요! 🗺️',
  '높은 구름 속에 가려져 정상의 모습이 보이지 않네요 ☁️',
  '안개가 걷히면 곧 등반로가 공개될 예정입니다! 🌫️',
  '전설 속의 고대 등반가가 머물던 비밀의 장소입니다 🚩',
  '안전을 위해 셰르파들이 먼저 길과 캠프를 확인 중이에요 🧗',
  '이 산의 정확한 좌표는 아직 탐험 본부에서 분석 중입니다 🤫',
  '주변의 기운이 너무 강력해 나침반이 방향을 잡지 못하네요 🧭',
  '베테랑 등반가들만이 접근할 수 있는 신비의 설산입니다 ✨',
  '베이스캠프에서 다음 원정을 위한 장비를 최종 점검 중입니다 🎒',
  '곧 입산 통제가 해제되고 등반 명령이 하사될 것입니다 🚧',
];

interface UnknownMountainCardProps {
  onToast?: (message: string) => void;
}

export function UnknownMountainCard({ onToast }: UnknownMountainCardProps) {
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
    <BaseCard className="unknown-mountain-card" onClick={handleClick} interactive padding="none">
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
              fill="var(--color-disabled)"
              opacity="0.6"
            />
            {/* 구름 (앞) */}
            <ellipse cx="30" cy="45" rx="15" ry="8" fill="var(--color-disabled)" opacity="0.8" />
            <ellipse cx="40" cy="42" rx="12" ry="6" fill="var(--color-disabled)" opacity="0.8" />
            <ellipse cx="50" cy="50" rx="18" ry="10" fill="var(--color-disabled)" opacity="0.8" />
            <ellipse cx="60" cy="48" rx="14" ry="7" fill="var(--color-disabled)" opacity="0.8" />
            <ellipse cx="70" cy="52" rx="16" ry="9" fill="var(--color-disabled)" opacity="0.8" />
          </svg>
        </div>
        <div className="unknown-mountain-text">
          <h3 className="unknown-mountain-title">미지의 산</h3>
          <p className="unknown-mountain-description">베이스캠프 구축 중</p>
          <button className="unknown-mountain-button">⛏️ 개척 중</button>
        </div>
      </div>
    </BaseCard>
  );
}
