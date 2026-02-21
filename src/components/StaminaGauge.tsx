import { useUserStore } from '../stores/useUserStore';
import './StaminaGauge.css';

export function StaminaGauge() {
  const { stamina } = useUserStore();
  const maxStamina = 5;
  const percentage = Math.min((stamina / maxStamina) * 100, 100);

  // 스태미나 상태에 따른 색상 결정
  const getColor = () => {
    if (stamina === 0) return 'var(--color-error)'; // Red for empty
    if (stamina <= 2) return 'var(--color-warning)'; // Yellow for low
    return 'var(--color-success)'; // Green for good
  };

  const isFull = stamina >= maxStamina;
  const isEmpty = stamina === 0;

  return (
    <div className={`stamina-gauge-container ${isEmpty ? 'shake' : ''}`}>
      <div className="stamina-gauge-icon-wrapper-hardened">
        <svg
          viewBox="0 0 24 24"
          className={`stamina-lightning ${isFull ? 'pulse' : ''}`}
          style={{ overflow: 'visible' }}
        >
          {isFull && (
            <path
              d="M13 2L3 14H11L9 22L19 10H11L13 2Z"
              fill={getColor()}
              className="stamina-glow-path"
            />
          )}
          <path d="M13 2L3 14H11L9 22L19 10H11L13 2Z" fill={getColor()} />
        </svg>
      </div>

      <div className="stamina-bar-track">
        <div
          className="stamina-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 10px ${getColor()}40`,
          }}
        />
        {/* 구분선 (1칸마다) */}
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="stamina-bar-divider" style={{ left: `${idx * 20}%` }} />
        ))}
      </div>

      <div className="stamina-text">
        <span style={{ color: getColor() }}>{stamina}</span>
        <span className="stamina-max">/{maxStamina}</span>
      </div>
    </div>
  );
}
