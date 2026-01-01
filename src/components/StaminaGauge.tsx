import { useUserStore } from '../stores/useUserStore';
import './StaminaGauge.css';

export function StaminaGauge() {
  const { stamina } = useUserStore();
  const maxStamina = 5;
  const percentage = Math.min((stamina / maxStamina) * 100, 100);

  // 스태미나 상태에 따른 색상 결정
  const getColor = () => {
    if (stamina === 0) return '#ff4d4d'; // Red for empty
    if (stamina <= 2) return '#ffca28'; // Yellow for low
    return '#4cd964'; // Green for good
  };

  const isFull = stamina >= maxStamina;
  const isEmpty = stamina === 0;

  return (
    <div className={`stamina-gauge-container ${isEmpty ? 'shake' : ''}`}>
      <div className="stamina-icon-wrapper">
        <svg
          viewBox="0 0 24 24"
          className={`stamina-lightning ${isFull ? 'pulse' : ''}`}
          fill={getColor()}
        >
          <path d="M13 2L3 14H11L9 22L19 10H11L13 2Z" />
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
