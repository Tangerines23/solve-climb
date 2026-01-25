import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { EquationTerm, Term } from './EquationTerm';
import './Algebra.css';
import { vibrateMedium } from '@/utils/haptic';

interface EquationVisualizerProps {
  initialLeft: Term[];
  initialRight: Term[];
  onSolved?: () => void;
}

export function EquationVisualizer({
  initialLeft,
  initialRight,
  onSolved: _onSolved,
}: EquationVisualizerProps) {
  const [leftSide, setLeftSide] = useState<Term[]>(initialLeft);
  const [rightSide, setRightSide] = useState<Term[]>(initialRight);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if solved: x = constant or constant = x
  useEffect(() => {
    // Simple check logic: One side has only 1 variable, Other side has only 1 constant
    // const isLeftSolved = leftSide.length === 1 && leftSide[0].type === 'variable' && rightSide.every(t => t.type === 'constant');
    // const isRightSolved = rightSide.length === 1 && rightSide[0].type === 'variable' && leftSide.every(t => t.type === 'constant');
    // In a real scenario, we might need to sum constants.
    // This visualizer focuses on the *movement* part first.
    // If we want to simulate "solving", we need to merge terms.
    // For Level 11-15 (Transposition), the goal is often just to move terms correctly.
  }, [leftSide, rightSide]);

  const handleTranspose = useCallback(
    (id: string) => {
      if (isAnimating) return;
      setIsAnimating(true);
      vibrateMedium();

      // Determine current side
      const isLeft = leftSide.some((t) => t.id === id);
      const sourceSide = isLeft ? leftSide : rightSide;
      // const targetSide = isLeft ? rightSide : leftSide;
      const setSource = isLeft ? setLeftSide : setRightSide;
      const setTarget = isLeft ? setRightSide : setLeftSide;

      const termIndex = sourceSide.findIndex((t) => t.id === id);
      if (termIndex === -1) return;

      const term = sourceSide[termIndex];

      // Create transformed term (flip sign)
      const newSign = term.sign === '+' ? '-' : '+';
      const newTerm: Term = { ...term, sign: newSign };

      // Remove from source
      const newSource = [...sourceSide];
      newSource.splice(termIndex, 1);
      setSource(newSource);

      // Add to target (append for now)
      setTarget((prev) => [...prev, newTerm]);

      // Cleanup animation lock
      setTimeout(() => setIsAnimating(false), 600);
    },
    [leftSide, rightSide, isAnimating]
  );

  return (
    <div className="algebra-container">
      <LayoutGroup>
        <div className="equation-display">
          {/* Left Side */}
          <motion.div
            className="equation-side left"
            layout
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <AnimatePresence mode="popLayout">
              {leftSide.map((term, _) => (
                <EquationTerm key={term.id} term={term} onTranspose={handleTranspose} />
              ))}
            </AnimatePresence>
            {leftSide.length === 0 && <span className="placeholder">0</span>}
          </motion.div>

          {/* Equals Sign */}
          <div className={`equals-sign ${isAnimating ? 'active' : ''}`}>=</div>

          {/* Right Side */}
          <motion.div
            className="equation-side right"
            layout
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <AnimatePresence mode="popLayout">
              {rightSide.map((term, _) => (
                <EquationTerm key={term.id} term={term} onTranspose={handleTranspose} />
              ))}
            </AnimatePresence>
            {rightSide.length === 0 && <span className="placeholder">0</span>}
          </motion.div>
        </div>
      </LayoutGroup>

      <p
        className="instruction-text"
        style={{ marginTop: 'var(--spacing-lg)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}
      >
        항을 클릭하여 이항해보세요!
      </p>
    </div>
  );
}
