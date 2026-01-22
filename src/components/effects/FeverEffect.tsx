import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import './Effects.css';

export function FeverEffect() {
  const { feverLevel, combo } = useGameStore();
  const animationEnabled = useSettingsStore((state) => state.animationEnabled);

  if (feverLevel === 0 && combo < 2) return null;

  return (
    <>
      {/* Edge Glow Overlay */}
      {feverLevel > 0 && <div className={`fever-overlay fever-level-${feverLevel}`} />}

      {/* Floating Particles (Simplified for performance) */}
      <div className="fever-particles">
        {animationEnabled && feverLevel >= 2 && <FeverParticles />}
      </div>

      {/* Combo Counter (Big) */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            className="combo-display"
            key={combo}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <div className="combo-count">{combo}</div>
            <div className="combo-text">Combo</div>

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
    </>
  );
}

function FeverParticles() {
  // Generate some static particles with CSS animations or Framer Motion
  // Using Framer Motion for rising embers
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
  const randomX = Math.random() * 100; // %
  const duration = 1 + Math.random() * 2; // 1-3s
  const delay = Math.random() * 2;

  return (
    <motion.div
      className="fever-particle"
      style={{ left: `${randomX}%` }}
      initial={{ y: '100vh', opacity: 0, scale: 0 }}
      animate={{ y: '-10vh', opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: 'linear',
      }}
    />
  );
}
