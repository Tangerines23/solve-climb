import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyPageTipPreview } from '../MyPageTipPreview';
import { useToastStore } from '@/stores/useToastStore';
import { generateQuestion } from '@/features/quiz';

const mockShowToast = vi.fn();

vi.mock('@/stores/useToastStore', () => ({
  useToastStore: vi.fn((selector: (s: { showToast: typeof mockShowToast }) => unknown) =>
    selector({ showToast: mockShowToast })
  ),
}));

vi.mock('@/features/quiz', () => ({
  generateQuestion: vi.fn(() => ({
    question: '1 + 1 = ?',
    answer: 2,
  })),
  getSolutionProcess: vi.fn(() => ['1단계: `1 + 1`을 계산합니다.']),
}));

vi.mock('@/components/geometry/GeometryTipVisualizer', () => ({
  GeometryTipVisualizer: () => <div data-testid="geometry-visualizer" />,
}));

describe('MyPageTipPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header and initial state correctly', () => {
    render(<MyPageTipPreview />);

    expect(screen.getByText('예습복습 (게임팁 미리보기)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기초' })).toHaveClass('active');
    expect(screen.getByText('수와 연산 능선')).toBeInTheDocument();
    expect(screen.getByText('레벨 1 / 30')).toBeInTheDocument();
    expect(useToastStore).toHaveBeenCalled();
  });

  it('shows locked category toast when locked tab is clicked', () => {
    render(<MyPageTipPreview />);

    fireEvent.click(screen.getByRole('button', { name: /논리/ }));
    expect(mockShowToast).toHaveBeenCalledWith('논리 분야는 현재 잠겨 있습니다.', '🔒');
  });

  it('switches world and renders GeometryTipVisualizer', () => {
    render(<MyPageTipPreview />);

    fireEvent.click(screen.getByRole('button', { name: '다음 능선' }));
    expect(screen.getByText('도형과 공간 능선')).toBeInTheDocument();
    expect(screen.getByTestId('geometry-visualizer')).toBeInTheDocument();
  });

  it('updates level and wraps around', () => {
    render(<MyPageTipPreview />);

    fireEvent.click(screen.getByRole('button', { name: '다음 레벨' }));
    expect(screen.getByText('레벨 2 / 30')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '이전 레벨' }));
    expect(screen.getByText('레벨 1 / 30')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '이전 레벨' }));
    expect(screen.getByText('레벨 30 / 30')).toBeInTheDocument();
  });

  it('refreshes sample question when refresh button is clicked', () => {
    render(<MyPageTipPreview />);

    const initialCalls = vi.mocked(generateQuestion).mock.calls.length;
    fireEvent.click(screen.getByTitle('새로운 문제 생성'));
    expect(vi.mocked(generateQuestion).mock.calls.length).toBeGreaterThan(initialCalls);
  });
});
