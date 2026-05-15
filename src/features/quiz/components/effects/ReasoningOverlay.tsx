import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Effects.css';

interface ReasoningOverlayProps {
  isVisible: boolean;
  isCorrect: boolean;
}

export function ReasoningOverlay({ isVisible, isCorrect }: ReasoningOverlayProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (isCorrect) {
      setIsUnlocked(true);
      const timer = setTimeout(() => {
        setIsUnlocked(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  if (!isVisible) return null;

  return (
    <div className="reasoning-container">
      <AnimatePresence>
        {!isUnlocked && !isCorrect && (
          <motion.div
            className="lock-icon"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
          >
            🔒
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            className="lock-icon unlocked"
            initial={{ scale: 0.8, opacity: 0, y: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: 1,
              y: -20,
              rotate: [0, -10, 10, 0],
            }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            🔓
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
