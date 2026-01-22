import { Term } from '@/components/algebra/EquationTerm';

/**
 * Parses an equation string into left and right structured terms.
 * Example: "2x + 5 = 15" -> { left: [2x, 5], right: [15] }
 */
export function parseEquation(equation: string): { left: Term[]; right: Term[] } {
  // 1. Remove optional spaces and split by equals sign
  const parts = equation.replace(/\s+/g, '').split('=');
  if (parts.length !== 2) {
    console.warn('Invalid equation format:', equation);
    return { left: [], right: [] };
  }

  const [leftStr, rightStr] = parts;

  // 2. Helper to split a side string into terms
  // Regex looks for + or - followed by content, but handles the first term without explicit sign
  const parseSide = (sideStr: string): Term[] => {
    // Modify string to ensure every term starts with a sign for easier detecting
    // "2x-5" -> "+2x-5"
    // "-2x+5" -> "-2x+5"
    let processingStr = sideStr;
    if (processingStr[0] !== '+' && processingStr[0] !== '-') {
      processingStr = '+' + processingStr;
    }

    // Split by lookahead for + or -
    // Regex logic: Matches + or - char, then any chars that are NOT + or -
    const matches = processingStr.match(/[+-][^+-]+/g);

    if (!matches) return [];

    return matches.map((match, _) => {
      const sign = match[0] as '+' | '-';
      let value = match.slice(1);

      // Determine type variable vs constant
      // Heuristic: contains 'x', 'y' or other letters is variable
      const type = /[a-zA-Z]/.test(value) ? 'variable' : 'constant';

      return {
        id: `term-${Math.random().toString(36).substr(2, 9)}`,
        value,
        side: 'left', // Temporary, will be overridden by caller context if needed, but side logic handles it
        type,
        sign,
      };
    });
  };

  const leftTerms = parseSide(leftStr).map((t) => ({ ...t, side: 'left' as const }));
  const rightTerms = parseSide(rightStr).map((t) => ({ ...t, side: 'right' as const }));

  return { left: leftTerms, right: rightTerms };
}
