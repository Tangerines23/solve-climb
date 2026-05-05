import { useCallback } from 'react';
import { parseEquation as parseEquationUtil } from '../../utils/algebra';
import { Term } from '../../types/algebra';

/**
 * Hook for algebra related operations.
 * Acts as a bridge between UI components and algebra utilities.
 */
export function useAlgebra() {
  /**
   * Parses an equation string into left and right structured terms.
   */
  const parseEquation = useCallback((equation: string): { left: Term[]; right: Term[] } => {
    return parseEquationUtil(equation);
  }, []);

  return {
    parseEquation,
  };
}
