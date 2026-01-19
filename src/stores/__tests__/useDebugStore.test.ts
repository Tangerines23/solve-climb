import { describe, it, expect, beforeEach } from 'vitest';
import { useDebugStore } from '../useDebugStore';

describe('useDebugStore', () => {
  beforeEach(() => {
    // Reset store state
    useDebugStore.setState({
      isAdminMode: false,
      selectedResource: null,
      isDebugPanelOpen: false,
      activeTab: 'quick',
      infiniteStamina: false,
      infiniteMinerals: false,
      infiniteTime: false,
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

  it('should set selectedResource to null when admin mode is toggled off', () => {
    const { toggleAdminMode, setSelectedResource } = useDebugStore.getState();

    toggleAdminMode();
    setSelectedResource('stamina');
    expect(useDebugStore.getState().selectedResource).toBe('stamina');

    toggleAdminMode();
    expect(useDebugStore.getState().isAdminMode).toBe(false);
    expect(useDebugStore.getState().selectedResource).toBeNull();
  });

  it('should preserve selectedResource when admin mode is toggled on', () => {
    const { toggleAdminMode, setSelectedResource } = useDebugStore.getState();

    setSelectedResource('minerals');
    toggleAdminMode();

    expect(useDebugStore.getState().isAdminMode).toBe(true);
    expect(useDebugStore.getState().selectedResource).toBe('minerals');
  });

  it('should set active tab', () => {
    const { setActiveTab } = useDebugStore.getState();

    setActiveTab('tier');
    expect(useDebugStore.getState().activeTab).toBe('tier');

    setActiveTab('badge');
    expect(useDebugStore.getState().activeTab).toBe('badge');

    setActiveTab('game');
    expect(useDebugStore.getState().activeTab).toBe('game');
  });

  it('should set infinite stamina', () => {
    const { setInfiniteStamina } = useDebugStore.getState();

    setInfiniteStamina(true);
    expect(useDebugStore.getState().infiniteStamina).toBe(true);

    setInfiniteStamina(false);
    expect(useDebugStore.getState().infiniteStamina).toBe(false);
  });

  it('should set infinite minerals', () => {
    const { setInfiniteMinerals } = useDebugStore.getState();

    setInfiniteMinerals(true);
    expect(useDebugStore.getState().infiniteMinerals).toBe(true);

    setInfiniteMinerals(false);
    expect(useDebugStore.getState().infiniteMinerals).toBe(false);
  });

  it('should set infinite time', () => {
    const { setInfiniteTime } = useDebugStore.getState();

    setInfiniteTime(true);
    expect(useDebugStore.getState().infiniteTime).toBe(true);

    setInfiniteTime(false);
    expect(useDebugStore.getState().infiniteTime).toBe(false);
  });

  it('should initialize with all infinite flags as false', () => {
    const { infiniteStamina, infiniteMinerals, infiniteTime } = useDebugStore.getState();
    expect(infiniteStamina).toBe(false);
    expect(infiniteMinerals).toBe(false);
    expect(infiniteTime).toBe(false);
  });

  it('should initialize with activeTab as quick', () => {
    const { activeTab } = useDebugStore.getState();
    expect(activeTab).toBe('quick');
  });

  it('should handle all resource types', () => {
    const { setSelectedResource } = useDebugStore.getState();

    setSelectedResource('stamina');
    expect(useDebugStore.getState().selectedResource).toBe('stamina');

    setSelectedResource('minerals');
    expect(useDebugStore.getState().selectedResource).toBe('minerals');

    setSelectedResource('items');
    expect(useDebugStore.getState().selectedResource).toBe('items');

    setSelectedResource(null);
    expect(useDebugStore.getState().selectedResource).toBeNull();
  });
});
