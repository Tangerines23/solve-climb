import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RankingPage } from '../RankingPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/Header');
vi.mock('../components/FooterNav');
vi.mock('../components/TierBadge');
vi.mock('../stores/useLevelProgressStore');
vi.mock('../utils/supabaseClient');

describe('RankingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <RankingPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

