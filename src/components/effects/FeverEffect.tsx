import { motion } from 'framer-motion';
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
