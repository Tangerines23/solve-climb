import { QuizCard } from './QuizCard';
import { QuizModals } from './QuizModals';
import { TodaysPromise } from './TodaysPromise';
import { FeverEffect } from './effects/FeverEffect';
import { TutorialOverlay } from './tutorial/TutorialOverlay';
import { LandmarkPopup } from './LandmarkPopup';
import { useQuiz } from '../contexts/QuizContext';
import { TUTORIAL_STEPS } from '@/constants/ui';
import { TutorialStep } from './tutorial/TutorialOverlay';
import { QuizPreview } from './QuizPreview';
import { useNavigate } from 'react-router-dom';

const CATEGORY_MAP: Record<string, string> = {
  기초: 'basic',
  논리: 'logic',
  대수: 'algebra',
  심화: 'expert',
  히라가나: 'hiragana',
  가타카나: 'katakana',
  어휘: 'vocabulary',
};

export function QuizLayout() {
  const { quizState, modalState, modalHandlers, feverLevel, altitudePhase } = useQuiz();
  const navigate = useNavigate();

  const { showTutorial } = modalState;
  const { setShowTutorial } = modalHandlers;
  const tutorialSteps: TutorialStep[] = TUTORIAL_STEPS as unknown as TutorialStep[];

  const categoryKey = quizState.categoryParam
    ? CATEGORY_MAP[quizState.categoryParam] || quizState.categoryParam
    : '';

  if (quizState.isPreview) {
    return (
      <QuizPreview
        mountainParam={quizState.subParam}
        categoryParam={quizState.categoryParam}
        worldParam={quizState.worldParam}
        subParam={quizState.subParam}
        levelParam={quizState.levelParam}
        category={quizState.category}
        topic={quizState.topic}
        keyboardType={quizState.keyboardType}
        navigate={navigate}
        useSystemKeyboard={quizState.useSystemKeyboard}
      />
    );
  }

  return (
    <div
      className={`quiz-page fever-level-${feverLevel}`}
      data-world={quizState.subParam || 'World1'}
      data-category={categoryKey}
      data-altitude-phase={altitudePhase}
    >
      <QuizCard />
      <QuizModals />
      <TodaysPromise />
      <FeverEffect />
      <TutorialOverlay
        isVisible={showTutorial}
        steps={tutorialSteps}
        onComplete={() => setShowTutorial(false)}
      />
      <LandmarkPopup />
    </div>
  );
}
