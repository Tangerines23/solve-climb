import { useUserStore } from '../stores/useUserStore';

export function useStamina() {
  const { stamina } = useUserStore();
  const maxStamina = 5;
  const percentage = Math.min((stamina / maxStamina) * 100, 100);

  const isFull = stamina >= maxStamina;
  const isEmpty = stamina === 0;

  return {
    stamina,
    maxStamina,
    percentage,
    isFull,
    isEmpty,
  };
}
