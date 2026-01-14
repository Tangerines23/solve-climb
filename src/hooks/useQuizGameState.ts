// 게임 상태 관리 로직을 관리하는 커스텀 훅
import { useState, useCallback } from 'react';
import { GameMode } from '../types/quiz';

interface UseQuizGameStateParams {
  score: number;
  gameMode: GameMode;
  categoryParam: string | null;
  subParam: string | null;
  levelParam: number | null;
  modeParam: string | null;
  isExhausted: boolean;
  navigate: (path: string) => void;
}

export function useQuizGameState({
  score,
  gameMode,
  categoryParam,
  subParam,
  levelParam,
  modeParam,
  isExhausted,
  navigate,
}: UseQuizGameStateParams) {
  const [totalQuestionsState, setTotalQuestionsState] = useState(0);
  const [wrongAnswersState, setWrongAnswersState] = useState<
    Array<{ question: string; wrongAnswer: string; correctAnswer: string }>
  >([]);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [solveTimesState, setSolveTimesState] = useState<number[]>([]);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);

  const handleGameOver = useCallback(
    (reason?: string) => {
      // 1. Calculate final results
      // Removed unused temporary variables
      // 게임 종료 시 바로 결과 페이지로 이동
      const params = new URLSearchParams();
      if (categoryParam) params.set('category', categoryParam);
      if (subParam) params.set('sub', subParam);
      if (levelParam !== null) params.set('level', levelParam.toString());
      if (modeParam) params.set('mode', modeParam);
      params.set('score', score.toString());
      params.set('total', totalQuestionsState.toString());
      if (isExhausted) params.set('exhausted', 'true');
      if (reason) params.set('reason', reason);

      // 서바이벌 모드: 오답 정보 및 평균 풀이 시간 전달
      if (gameMode === 'survival') {
        console.log('[QuizPage] 서바이벌 모드 종료 - 오답 데이터:', {
          wrongAnswersCount: wrongAnswersState.length,
          wrongAnswers: wrongAnswersState,
          gameMode,
        });

        if (wrongAnswersState.length > 0) {
          const questions = wrongAnswersState.map((w) => w.question).join('|');
          const wrongAns = wrongAnswersState.map((w) => w.wrongAnswer).join('|');
          const correctAns = wrongAnswersState.map((w) => w.correctAnswer).join('|');
          params.set('wrong_q', questions);
          params.set('wrong_a', wrongAns);
          params.set('correct_a', correctAns);

          console.log('[QuizPage] 오답 데이터 URL 파라미터 설정:', {
            wrong_q: questions,
            wrong_a: wrongAns,
            correct_a: correctAns,
          });
        } else {
          console.log('[QuizPage] 오답 데이터 없음 - URL 파라미터 설정 안 함');
        }

        // 평균 풀이 시간 계산 (초 단위, 소수점 2자리)
        if (solveTimesState.length > 0) {
          const averageTime =
            solveTimesState.reduce((sum, time) => sum + time, 0) / solveTimesState.length;
          params.set('avg_time', averageTime.toFixed(2));
        }
      }

      // 게임 세션 ID와 답안 정보 전달
      if (gameSessionId) {
        params.set('session_id', gameSessionId);
      }
      if (userAnswers.length > 0) {
        params.set('user_answers', userAnswers.join(','));
      }
      if (questionIds.length > 0) {
        params.set('question_ids', questionIds.join(','));
      }

      navigate(`/result?${params.toString()}`);
    },
    [
      categoryParam,
      subParam,
      isExhausted,
      levelParam,
      modeParam,
      score,
      totalQuestionsState,
      gameMode,
      wrongAnswersState,
      solveTimesState,
      navigate,
      gameSessionId,
      userAnswers,
      questionIds,
    ]
  );

  return {
    totalQuestions: totalQuestionsState,
    wrongAnswers: wrongAnswersState,
    questionStartTime,
    solveTimes: solveTimesState,
    gameSessionId,
    userAnswers,
    questionIds,
    setTotalQuestions: setTotalQuestionsState,
    setWrongAnswers: setWrongAnswersState,
    setQuestionStartTime,
    setSolveTimes: setSolveTimesState,
    setGameSessionId,
    setUserAnswers,
    setQuestionIds,
    handleGameOver,
  };
}
