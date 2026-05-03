import { useUserStore } from '../stores/useUserStore';

export function usePreGameLobbyBridge() {
  const { inventory } = useUserStore();

  return {
    inventory,
  };
}
