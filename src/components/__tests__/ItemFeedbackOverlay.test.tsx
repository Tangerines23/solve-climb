import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ItemFeedbackOverlay } from '../game/ItemFeedbackOverlay';

describe('ItemFeedbackOverlay', () => {
  it('should render without crashing', () => {
    const { container } = render(<ItemFeedbackOverlay itemCode="oxygen_tank" />);
    expect(container).toBeTruthy();
  });
});


