import { describe, it, expect, beforeEach } from 'vitest';
import { useDebugStore } from '../useDebugStore';

describe('useDebugStore', () => {
  beforeEach(() => {
    // Reset store state
    useDebugStore.setState({
      isAdminMode: false,
      selectedResource: null,
      isDebugPanelOpen: false,
    });
  });

  it('should initialize with default values', () => {
    const { isAdminMode, selectedResource, isDebugPanelOpen } = useDebugStore.getState();
    expect(isAdminMode).toBe(false);
    expect(selectedResource).toBeNull();
    expect(isDebugPanelOpen).toBe(false);
  });

  it('should toggle admin mode', () => {
    const { toggleAdminMode } = useDebugStore.getState();
    
    toggleAdminMode();
    expect(useDebugStore.getState().isAdminMode).toBe(true);
    
    toggleAdminMode();
    expect(useDebugStore.getState().isAdminMode).toBe(false);
  });

  it('should set selected resource', () => {
    const { setSelectedResource } = useDebugStore.getState();
    
    setSelectedResource('stamina');
    expect(useDebugStore.getState().selectedResource).toBe('stamina');
    
    setSelectedResource('minerals');
    expect(useDebugStore.getState().selectedResource).toBe('minerals');
  });

  it('should toggle debug panel', () => {
    const { toggleDebugPanel } = useDebugStore.getState();
    
    toggleDebugPanel();
    expect(useDebugStore.getState().isDebugPanelOpen).toBe(true);
    
    toggleDebugPanel();
    expect(useDebugStore.getState().isDebugPanelOpen).toBe(false);
  });
});

