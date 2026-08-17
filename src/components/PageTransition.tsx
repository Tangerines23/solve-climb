import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const animationEnabled = useSettingsStore((state: any) => state.animationEnabled);

  if (!animationEnabled) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className="page-transition-wrapper"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1.0] }}
      style={{ width: '100%', minHeight: '100%' }}
      data-vg-ignore="true"
    >
      {children}
    </motion.div>
  );
}
