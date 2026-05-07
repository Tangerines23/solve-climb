import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChallengeCard } from '../ChallengeCard';
import { getTodayChallenge } from '../../utils/challenge';

// Mock dependencies
vi.mock('../../utils/challenge', () => ({
  getTodayChallenge: vi.fn(),
}));

const mockSetCategoryTopic = vi.fn();
const mockSetTimeLimit = vi.fn();

vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: vi.fn((selector) => {
    const state = {
      setCategoryTopic: mockSetCategoryTopic,
      setTimeLimit: mockSetTimeLimit,
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
    mockSetCategoryTopic.mockClear();
    mockSetTimeLimit.mockClear();
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
      id: '1',
      title: 'Test Challenge',
      category: '수학',
      categoryId: 'math',
      topic: 'Addition',
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

  it('should navigate to game page when challenge button is clicked', async () => {
    const mockChallenge = {
      id: '1',
      title: 'Test Challenge',
      category: '수학',
      categoryId: 'math',
      topic: 'Addition',
      topicId: 'addition',
      level: 5,
      mode: 'time_attack',
    };

    vi.mocked(getTodayChallenge).mockResolvedValue(mockChallenge);

    renderChallengeCard();

    await waitFor(() => {
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });

    const challengeButton = screen.getByText('도전하기');
    challengeButton.click();

    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should disable button when loading', () => {
    vi.mocked(getTodayChallenge).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderChallengeCard();

    const challengeButton = screen.getByText('도전하기');
    expect(challengeButton).toBeDisabled();
  });

  it('should disable button when challenge is not loaded', async () => {
    vi.mocked(getTodayChallenge).mockRejectedValue(new Error('Failed to load'));

    renderChallengeCard();

    await waitFor(() => {
      expect(screen.getByText('챌린지를 불러올 수 없습니다.')).toBeInTheDocument();
    });

    const challengeButton = screen.getByText('도전하기');
    expect(challengeButton).toBeDisabled();
  });

  it('should enable button when challenge is loaded', async () => {
    const mockChallenge = {
      id: '1',
      title: 'Test Challenge',
      category: '수학',
      categoryId: 'math',
      topic: 'Addition',
      topicId: 'addition',
      level: 5,
      mode: 'time_attack',
    };

    vi.mocked(getTodayChallenge).mockResolvedValue(mockChallenge);

    renderChallengeCard();

    await waitFor(() => {
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });

    const challengeButton = screen.getByText('도전하기');
    expect(challengeButton).not.toBeDisabled();
  });

  it('should call setCategoryTopic and setTimeLimit when challenge button is clicked', async () => {
    const mockChallenge = {
      id: '1',
      title: 'Test Challenge',
      category: '수학',
      categoryId: 'math',
      topic: 'Addition',
      topicId: 'addition',
      level: 5,
      mode: 'time_attack',
    };

    vi.mocked(getTodayChallenge).mockResolvedValue(mockChallenge);

    renderChallengeCard();

    await waitFor(() => {
      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
    });

    const challengeButton = screen.getByText('도전하기');
    challengeButton.click();

    expect(mockSetCategoryTopic).toHaveBeenCalledWith('math', 'World1');
    expect(mockSetTimeLimit).toHaveBeenCalledWith(60);
  });

  it('should render challenge icon and title', () => {
    vi.mocked(getTodayChallenge).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderChallengeCard();

    expect(screen.getByText('오늘의 챌린지')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });
});
