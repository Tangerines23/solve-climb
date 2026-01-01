import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  it('renders message when isOpen is true', () => {
    render(<Toast message="Test message" isOpen={true} onClose={() => {}} autoClose={false} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Toast message="Test message" isOpen={false} onClose={() => {}} autoClose={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders with icon when provided', () => {
    render(
      <Toast message="Test message" isOpen={true} onClose={() => {}} autoClose={false} icon="✅" />
    );

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
