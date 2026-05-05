/**
 * Data structure representing a mathematical term in an equation.
 */
export interface Term {
  id: string;
  value: string | number; // 'x', '2x', '5', '-3'
  side: 'left' | 'right';
  type: 'variable' | 'constant';
  sign: '+' | '-';
  isFixed?: boolean; // e.g. the equals sign itself or immovable terms
}



