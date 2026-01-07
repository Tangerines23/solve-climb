import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameOverlay } from '../game/GameOverlay';

describe('GameOverlay', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <GameOverlay>
        <div>Test Content</div>
      </GameOverlay>
    );

    expect(container).toBeTruthy();
  });
});


