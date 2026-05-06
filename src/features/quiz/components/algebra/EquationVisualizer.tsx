import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { EquationTerm } from './EquationTerm';
import { Term } from '../../types/algebra';
import './Algebra.css';
import { useEquationVisualizerBridge } from '../../hooks/bridge/useEquationVisualizerBridge';

interface EquationVisualizerProps {
  initialLeft: Term[];
  initialRight: Term[];
  onSolved?: () => void;
}

export function EquationVisualizer({ initialLeft, initialRight }: EquationVisualizerProps) {
  const [leftSide, setLeftSide] = useState<Term[]>(initialLeft);
  const [rightSide, setRightSide] = useState<Term[]>(initialRight);
  const [isAnimating, setIsAnimating] = useState(false);
  const { vibrate } = useEquationVisualizerBridge();

  // Check if solved: x = constant or constant = x
  useEffect(() => {
    // Simple check logic could be added here
  }, [leftSide, rightSide]);

  const handleTranspose = useCallback(
    (id: string) => {
      if (isAnimating) return;
      setIsAnimating(true);
      vibrate();

      // Determine current side
      const isLeft = leftSide.some((t) => t.id === id);
      const sourceSide = isLeft ? leftSide : rightSide;
      const setSource = isLeft ? setLeftSide : setRightSide;
      const setTarget = isLeft ? setRightSide : setLeftSide;

      const termIndex = sourceSide.findIndex((t) => t.id === id);
      if (termIndex === -1) return;

      const term = sourceSide.at(termIndex);
      if (!term) return;

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
    [leftSide, rightSide, isAnimating, vibrate]
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
              {leftSide.map((term) => (
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
              {rightSide.map((term) => (
                <EquationTerm key={term.id} term={term} onTranspose={handleTranspose} />
              ))}
            </AnimatePresence>
            {rightSide.length === 0 && <span className="placeholder">0</span>}
          </motion.div>
        </div>
      </LayoutGroup>

      <p
        className="instruction-text"
        style={{
          marginTop: 'var(--spacing-lg)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
        }}
      >
        항을 클릭하여 이항해보세요!
      </p>
    </div>
  );
}
