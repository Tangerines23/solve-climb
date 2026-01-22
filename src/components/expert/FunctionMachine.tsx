import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Expert.css';

interface FunctionMachineProps {
  type: 'plus' | 'square';
  value: number; // The 'a' in x+a, or just dummy for square
  input: number; // The specific input x for this question
}

export function FunctionMachine({ type, value, input }: FunctionMachineProps) {
  const [phase, setPhase] = useState<'idle' | 'input' | 'process' | 'output'>('idle');

  // Rule text display
  const ruleText = type === 'plus' ? `+ ${value}` : 'x²';

  useEffect(() => {
    // Start animation sequence on mount
    const sequence = async () => {
      setPhase('input');
      await new Promise((r) => setTimeout(r, 500)); // Wait a bit

      // Move Input to Machine
      setPhase('process');
      await new Promise((r) => setTimeout(r, 1500)); // Processing time (shake)

      // Show Output
      setPhase('output');
    };

    sequence();
  }, [input, type, value]);

  return (
    <div className="expert-container">
      <div className="function-machine-wrapper">
        {/* Conveyor Belt Background */}
        <div className="conveyor-belt" />

        {/* Machine Body */}
        <motion.div
          className="machine-body"
          animate={
            phase === 'process'
              ? {
                  scale: [1, 1.05, 0.95, 1.05, 1],
                  rotate: [0, -2, 2, -1, 1, 0],
                  filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
                }
              : {}
          }
          transition={{ duration: 0.5, repeat: phase === 'process' ? Infinity : 0 }}
        >
          <div className="machine-label">Function</div>
          <div className="machine-rule">{ruleText}</div>

          {/* Gear Animation */}
          <motion.div
            className="machine-gear"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            ⚙️
          </motion.div>
        </motion.div>

        {/* Input Box */}
        <AnimatePresence>
          {(phase === 'input' || phase === 'idle') && (
            <motion.div
              className="io-box"
              initial={{ x: -150, opacity: 0 }}
              animate={{ x: phase === 'input' ? -150 : 0, opacity: 1 }} // Start far left
              exit={{ x: 0, opacity: 0, scale: 0.5 }} // Move to center (0 relative to wrapper center? No, absolute positioning needed)
              // Let's use layout animation or absolute positioning logic
              // Actually, let's keep it simple relative to container.
              // Container is flux center.
              // Machine is center.
              // Input starts left (-150px) and moves to center (0px) then disappears inside
            >
              {input}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Moving Input Animation (Input -> Machine) */}
        {phase === 'process' && (
          <motion.div
            className="io-box"
            initial={{ x: -150, opacity: 1 }}
            animate={{ x: 0, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            {input}
          </motion.div>
        )}

        {/* Output Box */}
        <AnimatePresence>
          {phase === 'output' && (
            <motion.div
              className="io-box"
              initial={{ x: 0, opacity: 0, scale: 0.5 }} // Start inside machine
              animate={{ x: 150, opacity: 1, scale: 1 }} // Move to right
              transition={{ type: 'spring', damping: 12 }}
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              ?
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p
        className="instruction-text"
        style={{ marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}
      >
        {phase === 'output' ? '결과를 예측해보세요!' : '함수 상자가 작동 중입니다...'}
      </p>
    </div>
  );
}
