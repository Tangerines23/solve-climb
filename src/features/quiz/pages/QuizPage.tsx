import { QuizProvider } from '../contexts/QuizProvider';
import { QuizLayout } from '../components/QuizLayout';
import { useQuizPageBridge } from '../hooks/bridge/useQuizPageBridge';
import './QuizPage.css';

/**
 * QuizPage - 퀴즈 페이지의 메인 쉘 컴포넌트
 * - URL 파라미터 유효성 검사 및 초기화 담당
 * - QuizProvider를 통해 하위 컴포넌트에 상태 제공
 */
export function QuizPage() {
  const { params } = useQuizPageBridge();

  return (
    <QuizProvider params={params}>
      <QuizLayout />
    </QuizProvider>
  );
}
