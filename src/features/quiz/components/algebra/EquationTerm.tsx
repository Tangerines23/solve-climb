import { motion } from 'framer-motion';
import { useState } from 'react';
import './Algebra.css';

import { Term } from '../../types/algebra';

interface EquationTermProps {
  term: Term;
  onTranspose: (id: string) => void;
  isDragging?: boolean;
}

export function EquationTerm({ term, onTranspose }: EquationTermProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isNegative = term.sign === '-';

  return (
    <motion.div
      layoutId={term.id}
      className={`equation-term ${term.type} ${isNegative ? 'negative' : 'positive'}`}
      onClick={() => !term.isFixed && onTranspose(term.id)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={false}
      animate={{
        color: isNegative ? 'var(--color-accent-red)' : 'var(--color-text-primary)',
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <span className="term-sign">{term.sign === '+' ? '+' : '−'}</span>
      <span className="term-value">{term.value}</span>
      {/* Visual hint for transposition */}
      {!term.isFixed && isHovered && (
        <motion.div
          className="transpose-hint"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          이항
        </motion.div>
      )}
    </motion.div>
  );
}
