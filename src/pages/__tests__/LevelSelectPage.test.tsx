import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { LevelSelectPage } from '../LevelSelectPage';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../components/ClimbGraphic');
vi.mock('../components/MyRecordCard');
vi.mock('../components/LevelListCard');
vi.mock('../components/ModeSelectModal');
vi.mock('../components/FooterNav');
vi.mock('../components/Toast');
vi.mock('../stores/useLevelProgressStore');
vi.mock('../utils/storage');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams()],
  };
});

describe('LevelSelectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <LevelSelectPage />
      </BrowserRouter>
    );

    expect(container).toBeTruthy();
  });
});

