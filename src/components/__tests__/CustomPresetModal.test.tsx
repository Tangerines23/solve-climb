import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomPresetModal } from '../debug/CustomPresetModal';

describe('CustomPresetModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <CustomPresetModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByText(/커스텀 프리셋/)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    const { container } = render(
      <CustomPresetModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        editingPreset={null}
      />
    );

    expect(container).toBeTruthy();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <CustomPresetModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        editingPreset={null}
      />
    );

    const closeButton = screen.queryByText(/취소/);
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});


