import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChallengeCard } from '../ChallengeCard';
import { getTodayChallenge } from '../../utils/challenge';

// Mock dependencies
vi.mock('../../utils/challenge', () => ({
  getTodayChallenge: vi.fn(),
}));

vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: vi.fn((selector) => {
    const state = {
      setCategoryTopic: vi.fn(),
      setTimeLimit: vi.fn(),
    };
    return selector(state);
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ChallengeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderChallengeCard = () => {
    return render(
      <BrowserRouter>
        <ChallengeCard />
      </BrowserRouter>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(getTodayChallenge).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderChallengeCard();

    expect(screen.getByText('오늘의 챌린지')).toBeInTheDocument();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('should render challenge when loaded', async () => {
    const mockChallenge = {
      title: 'Test Challenge',
      category: '수학',
      categoryId: 'math',
      topicId: 'addition',
      level: 5,
      mode: 'time_attack',
    };

    vi.mocked(getTodayChallenge).mockResolvedValue(mockChallenge);

    renderChallengeCard();

    await waitFor(() => {
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });

    expect(screen.getByText('도전하기')).toBeInTheDocument();
  });

  it('should render error state when challenge fails to load', async () => {
    vi.mocked(getTodayChallenge).mockRejectedValue(new Error('Failed to load'));

    renderChallengeCard();

    await waitFor(() => {
      expect(screen.getByText('챌린지를 불러올 수 없습니다.')).toBeInTheDocument();
    });
  });
});

