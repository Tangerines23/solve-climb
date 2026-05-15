import { useLoadingStore } from '../stores/useLoadingStore';

export function useGlobalLoading() {
  const isAnyLoading = useLoadingStore((state) => state.isAnyLoading());

  return {
    isAnyLoading,
  };
}
