import { useStamina } from '../hooks/core/useStamina';
import './StaminaGauge.css';

export function StaminaGauge() {
  const { stamina, maxStamina, percentage, isFull, isEmpty } = useStamina();

  return (
    <div
      className={`stamina-gauge-container ${isEmpty ? 'shake' : ''}`}
      data-stamina={stamina}
      data-is-full={isFull}
    >
      <div className="stamina-gauge-icon-wrapper-hardened">
        <svg viewBox="0 0 24 24" className={`stamina-lightning ${isFull ? 'pulse' : ''}`}>
          {isFull && <path d="M13 2L3 14H11L9 22L19 10H11L13 2Z" className="stamina-glow-path" />}
          <path d="M13 2L3 14H11L9 22L19 10H11L13 2Z" className="stamina-main-path" />
        </svg>
      </div>

      <div className="stamina-bar-track">
        <div className="stamina-bar-fill" style={{ width: `${percentage}%` }} />
        {/* 구분선 (1칸마다) */}
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="stamina-bar-divider"
            style={{ left: `${idx * 20}%` } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="stamina-text">
        <span className="current-stamina">{stamina}</span>
        <span className="stamina-max">/{maxStamina}</span>
      </div>
    </div>
  );
}
