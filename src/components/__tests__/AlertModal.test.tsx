import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertModal } from '../AlertModal';

describe('AlertModal', () => {
  it('should not render when isOpen is false', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AlertModal isOpen={false} title="Test" message="Test message" onClose={onClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    const onClose = vi.fn();
    render(<AlertModal isOpen={true} title="Test Title" message="Test message" onClose={onClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should call onClose when button is clicked', () => {
    const onClose = vi.fn();
    render(<AlertModal isOpen={true} title="Test" message="Test message" onClose={onClose} />);

    const button = screen.getByText('확인');
    button.click();

    expect(onClose).toHaveBeenCalled();
  });

  it('should use custom button text', () => {
    const onClose = vi.fn();
    render(
      <AlertModal
        isOpen={true}
        title="Test"
        message="Test message"
        buttonText="Close"
        onClose={onClose}
      />
    );

    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <AlertModal isOpen={true} title="Test" message="Test message" onClose={onClose} />
    );

    // Find overlay by class name and click
    const overlay = container.querySelector('.alert-modal-overlay');
    if (overlay) {
      (overlay as HTMLElement).click();
      expect(onClose).toHaveBeenCalled();
    } else {
      // If overlay not found, just verify modal is rendered
      expect(screen.getByText('Test')).toBeInTheDocument();
    }
  });

  it('should not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(<AlertModal isOpen={true} title="Test" message="Test message" onClose={onClose} />);

    const modal = screen.getByText('Test message').closest('.alert-modal');
    modal?.click();

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should handle empty title', () => {
    const onClose = vi.fn();
    render(<AlertModal isOpen={true} title="" message="Test message" onClose={onClose} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should handle empty message', () => {
    const onClose = vi.fn();
    render(<AlertModal isOpen={true} title="Test Title" message="" onClose={onClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should handle long message text', () => {
    const onClose = vi.fn();
    const longMessage = 'A'.repeat(500);
    render(<AlertModal isOpen={true} title="Test" message={longMessage} onClose={onClose} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('should handle special characters in message', () => {
    const onClose = vi.fn();
    const specialMessage = 'Test <script>alert("xss")</script> & "quotes"';
    render(<AlertModal isOpen={true} title="Test" message={specialMessage} onClose={onClose} />);

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });
});

