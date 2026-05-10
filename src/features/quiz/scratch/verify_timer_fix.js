const PRESSURE_FACTOR = {
  START: 2.0,
  MIN: 0.8,
  DECAY: 0.01,
};

function calculateDynamicTimeLimit(baseTime, totalQuestionsAnswered) {
  const currentPressure = Math.max(
    PRESSURE_FACTOR.MIN,
    PRESSURE_FACTOR.START - totalQuestionsAnswered * PRESSURE_FACTOR.DECAY
  );

  return Math.floor(baseTime * currentPressure);
}

// Test cases
console.log('Q 0: ', calculateDynamicTimeLimit(10, 0)); // 10 * 2.0 = 20
console.log('Q 1: ', calculateDynamicTimeLimit(10, 1)); // 10 * 1.99 = 19.9 -> 19
console.log('Q 50: ', calculateDynamicTimeLimit(10, 50)); // 10 * (2.0 - 0.5) = 15
console.log('Q 150: ', calculateDynamicTimeLimit(10, 150)); // 10 * (max(0.8, 2.0 - 1.5)) = 8
