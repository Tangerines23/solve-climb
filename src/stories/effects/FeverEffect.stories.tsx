import type { Meta, StoryObj } from '@storybook/react-vite';
import { motion, AnimatePresence } from 'framer-motion';
import '@/components/effects/Effects.css';

// Mock Component for Storybook (Decoupled from Zustand Store)
// 실제 컴포넌트는 Store에 의존하므로, Storybook용으로 Props를 받는 버전을 만듭니다.
const MockFeverEffect = ({
  feverLevel,
  combo,
  animationEnabled = true,
}: {
  feverLevel: number;
  combo: number;
  animationEnabled?: boolean;
}) => {
  if (feverLevel === 0 && combo < 2)
    return (
      <div className="text-white p-4">콤보를 2 이상으로 올리거나 피버 레벨을 설정해보세요!</div>
    );

  return (
    <div className="relative w-full h-[600px] bg-slate-900 overflow-hidden border border-slate-700 rounded-lg">
      <div className="absolute top-4 left-4 text-white z-50">
        <div>Fever Level: {feverLevel}</div>
        <div>Combo: {combo}</div>
      </div>

      {/* Edge Glow Overlay */}
      {feverLevel > 0 && (
        <div
          className={`fever-overlay fever-level-${feverLevel}`}
          style={{ position: 'absolute' }}
        />
      )}

      {/* Floating Particles */}
      <div
        className="fever-particles"
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        {animationEnabled && feverLevel >= 2 && <FeverParticles />}
      </div>

      {/* Combo Counter */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            className={`combo-display fever-level-${feverLevel}`}
            key={combo}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              right: 'auto',
            }}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <div className="combo-count text-white">{combo}</div>
            <div className={`combo-text ${feverLevel === 2 ? 'text-amber-300' : 'text-slate-200'}`}>
              Combo
            </div>

            {/* Fever Progress Bar */}
            <div className="fever-progress-track">
              <motion.div
                className="fever-progress-bar"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (combo / 20) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function FeverParticles() {
  const particles = Array.from({ length: 15 });
  return (
    <>
      {particles.map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </>
  );
}

function Particle({ index: _index }: { index: number }) {
  const randomX = Math.random() * 100;
  const duration = 1 + Math.random() * 2;
  const delay = Math.random() * 2;

  return (
    <motion.div
      className="fever-particle"
      style={{ left: `${randomX}%` }}
      initial={{ y: '100%', opacity: 0, scale: 0 }}
      animate={{ y: '-10%', opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
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
  title: 'Effects/Fever & Combo',
  component: MockFeverEffect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    feverLevel: {
      control: { type: 'select' },
      options: [0, 1, 2],
      description: '0: 평소, 1: 모멘텀, 2: 세컨드 윈드',
    },
    combo: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '콤보 카운트',
    },
  },
} satisfies Meta<typeof MockFeverEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    feverLevel: 0,
    combo: 0,
  },
};

export const ComboActive: Story = {
  args: {
    feverLevel: 0,
    combo: 5,
  },
};

export const Level1_Momentum: Story = {
  args: {
    feverLevel: 1,
    combo: 15,
  },
};

export const Level2_SecondWind: Story = {
  args: {
    feverLevel: 2,
    combo: 50,
  },
};
