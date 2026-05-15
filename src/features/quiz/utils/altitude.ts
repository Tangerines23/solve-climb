/**
 * Calculates the altitude phase based on the number of questions answered.
 * This logic is shared between the QuizPage and ResultPage to ensure consistent theming.
 */
export type AltitudePhase = 'forest' | 'rock' | 'clouds' | 'space';

export function calculateAltitudePhase(totalQuestions: number): AltitudePhase {
  if (totalQuestions <= 10) return 'forest';
  if (totalQuestions <= 25) return 'rock';
  if (totalQuestions <= 45) return 'clouds';
  return 'space';
}
