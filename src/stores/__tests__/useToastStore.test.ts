import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from '../useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.getState().hideToast();
  });

  it('should initialize with default state', () => {
    const state = useToastStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.message).toBe('');
    expect(state.duration).toBe(2000);
  });

  it('should show toast', () => {
    const { showToast } = useToastStore.getState();
    showToast('Test message', 'success', 3000);

    const state = useToastStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.message).toBe('Test message');
    expect(state.icon).toBe('success');
    expect(state.duration).toBe(3000);
  });

  it('should show toast with default duration', () => {
    const { showToast } = useToastStore.getState();
    showToast('Test message');

    const state = useToastStore.getState();
    expect(state.duration).toBe(2000);
  });

  it('should hide toast', () => {
    const { showToast, hideToast } = useToastStore.getState();
    showToast('Test message');
    hideToast();

    const state = useToastStore.getState();
    expect(state.isOpen).toBe(false);
  });
});
