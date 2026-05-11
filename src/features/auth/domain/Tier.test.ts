import { describe, it, expect } from 'vitest';
import { Tier } from './Tier';

describe('Tier Value Object', () => {
  describe('create', () => {
    it('should return UNRANKED for null or undefined', () => {
      expect(Tier.create(null).isUnranked).toBe(true);
      expect(Tier.create(undefined).isUnranked).toBe(true);
      expect(Tier.create(null)).toBe(Tier.UNRANKED);
    });

    it('should normalize level within range 0-6', () => {
      expect(Tier.create(-1).value).toBe(0);
      expect(Tier.create(7).value).toBe(6);
      expect(Tier.create(3.5).value).toBe(3);
    });
  });

  describe('UI display', () => {
    it('should return correct display names', () => {
      expect(Tier.create(0).getDisplayName()).toBe('베이스캠프');
      expect(Tier.create(6).getDisplayName()).toBe('전설');
      expect(Tier.UNRANKED.getDisplayName()).toBe('등급 없음');
    });

    it('should return correct icons', () => {
      expect(Tier.create(0).icon).toBe('⛺');
      expect(Tier.create(6).icon).toBe('👑');
    });

    it('should return correct color variables', () => {
      expect(Tier.create(0).colorVar).toBe('--color-tier-base');
      expect(Tier.create(6).colorVar).toBe('--color-tier-legend');
    });
  });
});
