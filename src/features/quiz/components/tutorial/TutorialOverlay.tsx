import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TutorialOverlay.css';

export interface TutorialStep {
  targetId: string; // DOM ID to highlight
  text: string;
  action: 'tap' | 'read';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  isVisible: boolean;
  onComplete: () => void;
}

export function TutorialOverlay({ steps, isVisible, onComplete }: TutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) setCurrentStepIndex(0);
  }, [isVisible]);

  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      onComplete();
    }
  }, [currentStepIndex, steps.length, onComplete]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!isVisible || currentStepIndex >= steps.length) return null;

  const currentStep = Object.prototype.hasOwnProperty.call(steps, currentStepIndex)
    ? // eslint-disable-next-line security/detect-object-injection -- index validated above
      steps[currentStepIndex]
    : undefined;
  if (!currentStep) return null;

  // Find target element position
  // Note: In a real implementation, we might need a ResizeObserver or detailed positioning logic
  // For now, we assume simple centered or approximated positions if target not found,
  // or use a simple mask.

  return (
    <div className="tutorial-overlay" onClick={handleNext}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          className="tutorial-instruction"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="hand-pointer">👆</div>
          <div className="instruction-text">{currentStep.text}</div>
        </motion.div>
      </AnimatePresence>

      {/* Highlight Mask (Simplified) */}
      {/* Ideally we'd calculate rect of document.getElementById(currentStep.targetId) */}
    </div>
  );
}
