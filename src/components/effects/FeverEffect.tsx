import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import './Effects.css';

export function FeverEffect() {
  const { feverLevel, combo } = useGameStore();

  if (feverLevel === 0) return null;

  return (
    <>
      {/* Edge Glow Overlay */}
      <div className={`fever-overlay fever-level-${feverLevel}`} />

      {/* Floating Particles (Simplified for performance) */}
      <div className="fever-particles">{feverLevel >= 2 && <FeverParticles />}</div>

      {/* Combo Counter (Big) */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            className="combo-display"
            key={combo}
            initial={{ scale: 1.5, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: -10 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {combo}
            <span className="combo-text">COMBO!</span>
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
