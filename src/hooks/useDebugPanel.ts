import { useDebugStore } from '../stores/useDebugStore';

export function useDebugPanel() {
  const { isDebugPanelOpen, activeTab, toggleDebugPanel, setActiveTab } = useDebugStore();

  return {
    isDebugPanelOpen,
    activeTab,
    toggleDebugPanel,
    setActiveTab,
  };
}
