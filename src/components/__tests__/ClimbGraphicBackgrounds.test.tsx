import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ClimbBackground } from '../ClimbGraphicBackgrounds';

describe('ClimbGraphicBackgrounds', () => {
  describe('ClimbBackground', () => {
    it('should render ClimbBackground for World1 and 기초 category', () => {
      const { container } = render(<ClimbBackground world="World1" category="기초" />);
      expect(container).toBeTruthy();
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render ClimbBackground for World1 and 대수 category', () => {
      const { container } = render(<ClimbBackground world="World1" category="대수" />);
      expect(container).toBeTruthy();
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render ClimbBackground for World1 and 논리 category', () => {
      const { container } = render(<ClimbBackground world="World1" category="논리" />);
      expect(container).toBeTruthy();
    });

    it('should render ClimbBackground for World1 and 심화 category', () => {
      const { container } = render(<ClimbBackground world="World1" category="심화" />);
      expect(container).toBeTruthy();
    });

    it('should render with different totalLevels', () => {
      const { container } = render(
        <ClimbBackground world="World1" category="기초" totalLevels={30} />
      );
      expect(container).toBeTruthy();
    });
  });
});
