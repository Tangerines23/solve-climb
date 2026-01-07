import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafetyRopeOverlay } from '../game/SafetyRopeOverlay';

describe('SafetyRopeOverlay', () => {
  it('should render without crashing', () => {
    const { container } = render(<SafetyRopeOverlay />);
    expect(container).toBeTruthy();
  });
});


