import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { getItemEmoji } from '@/constants/items';

export function useBackpack(isOpen: boolean) {
  const { inventory } = useUserStore();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return {
    inventory,
    isAnimating,
    getItemEmoji,
  };
}
