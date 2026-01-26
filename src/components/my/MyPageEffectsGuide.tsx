interface EffectItem {
  icon: string;
  name: string;
  description: string;
  color?: string;
}

export function MyPageEffectsGuide() {
  const items: EffectItem[] = [
    {
      icon: '🫧',
      name: '산소통',
      description: '제한 시간 10초 연장 (타임어택)',
      color: 'var(--color-cyan-400)',
    },
    {
      icon: '🪢',
      name: '안전 로프',
      description: '오답 시 콤보 보호 및 재도전',
      color: 'var(--color-yellow-400)',
    },
    {
      icon: '🚀',
      name: '조명탄',
      description: '게임 오버 시 1회 부활 (서바이벌)',
      color: 'var(--color-red-400)',
    },
    {
      icon: '⚡',
      name: '파워젤',
      description: '시작 시 콤보 1단계 획득',
      color: 'var(--color-yellow-400)',
    },
    {
      icon: '⏱️',
      name: '라스트 스퍼트',
      description: '종료 시 15초 추가 연장 (타임어택)',
      color: 'var(--color-teal-400)',
    },
  ];

  const effects: EffectItem[] = [
    {
      icon: '🔥',
      name: 'Momentum',
      description: '5콤보 이상, 점수 1.2배 획득',
      color: 'var(--color-orange-500)',
    },
    {
      icon: '💎',
      name: 'Second Wind',
      description: '20콤보 이상, 점수 1.5배 획득',
      color: 'var(--color-blue-500)',
    },
    {
      icon: '😫',
      name: '탈진 상태',
      description: '스태미나 0일 때 점수 20% 감소',
      color: 'var(--color-gray-500)',
    },
  ];

  const envPhases: EffectItem[] = [
    { icon: '🌲', name: 'Forest', description: '0m ~ 500m 미만' },
    { icon: '🧗', name: 'Rock', description: '500m ~ 1500m 미만' },
    { icon: '☁️', name: 'Clouds', description: '1500m ~ 3000m 미만' },
    { icon: '🌌', name: 'Space', description: '3000m 이상' },
  ];

  return (
    <div className="my-page-effects-guide">
      <div className="my-page-settings-section-title">아이템 및 효과 가이드</div>

      <div className="effects-guide-container">
        <div className="effects-guide-group">
          <h3 className="effects-guide-subtitle">🎒 등반 보조 아이템</h3>
          <div className="effects-grid">
            {items.map((item, idx) => (
              <div key={idx} className="effect-card">
                <div className="effect-icon-wrapper" style={{ backgroundColor: `${item.color}22` }}>
                  <span className="effect-icon">{item.icon}</span>
                </div>
                <div className="effect-info">
                  <span className="effect-name">{item.name}</span>
                  <span className="effect-description">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="effects-guide-group">
          <h3 className="effects-guide-subtitle">✨ 게임 내 효과</h3>
          <div className="effects-grid">
            {effects.map((effect, idx) => (
              <div key={idx} className="effect-card">
                <div
                  className="effect-icon-wrapper"
                  style={{ backgroundColor: `${effect.color}22` }}
                >
                  <span className="effect-icon">{effect.icon}</span>
                </div>
                <div className="effect-info">
                  <span className="effect-name">{effect.name}</span>
                  <span className="effect-description">{effect.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="effects-guide-group">
          <h3 className="effects-guide-subtitle">🌍 고도별 환경 변화</h3>
          <div className="effects-grid env-grid">
            {envPhases.map((phase, idx) => (
              <div key={idx} className="effect-card phase-card">
                <div className="effect-icon-wrapper">
                  <span className="effect-icon">{phase.icon}</span>
                </div>
                <div className="effect-info">
                  <span className="effect-name">{phase.name}</span>
                  <span className="effect-description">{phase.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
