import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ArithmeticBackground, EquationsBackground } from '../ClimbGraphicBackgrounds';

describe('ClimbGraphicBackgrounds', () => {
  describe('ArithmeticBackground', () => {
    it('should render ArithmeticBackground', () => {
      const { container } = render(<ArithmeticBackground />);
      expect(container).toBeTruthy();
    });

    it('should render ArithmeticBackground with custom props', () => {
      const { container } = render(
        <ArithmeticBackground categoryColor="#10b981" totalLevels={10} />
      );
      expect(container).toBeTruthy();
    });

    it('should render with default props when no props provided', () => {
      const { container } = render(<ArithmeticBackground />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with different totalLevels', () => {
      const { container } = render(<ArithmeticBackground totalLevels={20} />);
      expect(container).toBeTruthy();
    });
  });

  describe('EquationsBackground', () => {
    it('should render EquationsBackground', () => {
      const { container } = render(<EquationsBackground />);
      expect(container).toBeTruthy();
    });

    it('should render EquationsBackground with custom props', () => {
      const { container } = render(
        <EquationsBackground categoryColor="#3b82f6" totalLevels={10} />
      );
      expect(container).toBeTruthy();
    });

    it('should render with default props when no props provided', () => {
      const { container } = render(<EquationsBackground />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with different totalLevels', () => {
      const { container } = render(<EquationsBackground totalLevels={15} />);
      expect(container).toBeTruthy();
    });
  });
});
