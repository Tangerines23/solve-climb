// eslint-disable-next-line storybook/no-renderer-packages
import type { Meta, StoryObj } from '@storybook/react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/components/effects/Effects.css';
import '@/index.css';

// Mock Component that mimics Game Overlay
const MockGameScreen = ({
  feverLevel,
  combo,
  animationEnabled = true,
}: {
  feverLevel: number;
  combo: number;
  animationEnabled?: boolean;
}) => {
  // 실제 게임 화면과 유사한 배경 (Slate-900 ~ Slate-800 Gradient)
  const gameBackgroundStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '600px',
    background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
    borderRadius: 'var(--rounded-card)',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontFamily: '"Pretendard", "Inter", sans-serif', // 인게임 폰트 적용 시도
  };

  return (
    <div style={gameBackgroundStyle}>
      {/* 가상의 게임 요소들 (배경 느낌 내기용) */}
      <div
        style={{ position: 'absolute', top: '20px', left: '20px', color: 'white', opacity: 0.5 }}
      >
        <div style={{ fontSize: '14px' }}>LEVEL 1</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>구구단 언덕</div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          width: '100%',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '300px',
            height: '200px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--rounded-md)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          (Quiz Area)
        </div>
      </div>

      {/* --- 실제 이펙트 영역 --- */}

      {/* 1. Fever Overlay (화면 테두리 효과) */}
      {feverLevel > 0 && (
        <div
          className={`fever-overlay fever-level-${feverLevel}`}
          style={{ position: 'absolute', inset: 0, zIndex: 10 }}
        />
      )}

      {/* 2. Particles (피버 파티클) */}
      <div
        className="fever-particles"
        style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}
      >
        {animationEnabled && feverLevel >= 2 && <FeverParticles />}
      </div>

      {/* 3. Combo Display (핵심 UI) */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            className={`combo-display fever-level-${feverLevel}`}
            key={combo}
            style={{
              position: 'absolute',
              top: '120px',
              right: '20px',
              zIndex: 20,
            }}
            initial={{ scale: 1.5, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <div
              className={`combo-count ${feverLevel === 2 ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.5)]' : 'text-white'}`}
            >
              {combo}
            </div>
            <div className={`combo-text ${feverLevel === 2 ? 'text-amber-300' : 'text-slate-200'}`}>
              {feverLevel === 2 ? '🔥 SUPER COMBO' : 'COMBO'}
            </div>

            {/* Fever Progress Bar */}
            <div className="fever-progress-track">
              <motion.div
                className="fever-progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (combo % 20) * 5)}%` }} // 콤보 게이지 시각화 수정
                transition={{ type: 'tween', ease: 'linear', duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ... Particle code remains same ...
function FeverParticles() {
  const particles = Array.from({ length: 20 }); // 파티클 개수 증가
  return (
    <>
      {particles.map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </>
  );
}

function Particle({ index }: { index: number }) {
  const randomX = Math.random() * 100;
  const duration = 1 + Math.random() * 2;
  const delay = Math.random() * 2 + index * 0.05;
  const size = 5 + Math.random() * 10;

  return (
    <motion.div
      className="fever-particle"
      style={{
        left: `${randomX}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, rgba(255,255,255,0.8), rgba(255,100,0,0) 70%)`, // 더 불꽃같은 파티클
      }}
      initial={{ y: '100%', opacity: 0, scale: 0 }}
      animate={{ y: '-20%', opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: 'linear',
      }}
    />
  );
}

const meta = {
  title: 'Effects/Fever & Combo (Real)',
  component: MockGameScreen,
  parameters: {
    layout: 'centered', // 화면 중앙에 배치
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  argTypes: {
    feverLevel: {
      control: { type: 'inline-radio', options: [0, 1, 2] },
      description: '피버 레벨 (0: 없음, 1: 예열, 2: 폭발)',
    },
    combo: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '콤보 카운트 (슬라이더를 움직여보세요!)',
    },
  },
} satisfies Meta<typeof MockGameScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InGamePreview: Story = {
  args: {
    feverLevel: 0,
    combo: 0,
  },
};

export const FeverMode: Story = {
  args: {
    feverLevel: 2,
    combo: 45,
  },
};
