import { describe, it, expect } from 'vitest';
import {
  generateGuestProfileId,
  createInitialGuestProfile,
  createLocalAnonymousSession,
  getAuthLoginButtonText,
} from '../authUtils';

describe('authUtils', () => {
  describe('generateGuestProfileId', () => {
    it('uses trimmed candidateId if provided and valid', () => {
      expect(generateGuestProfileId('  custom-uuid-123  ')).toBe('custom-uuid-123');
    });

    it('generates random UUID when crypto.randomUUID is available', () => {
      const id = generateGuestProfileId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('falls back to guest_ prefix when crypto.randomUUID is undefined', () => {
      const origCrypto = globalThis.crypto;
      // @ts-expect-error: mocking crypto
      delete globalThis.crypto;

      const id = generateGuestProfileId();
      expect(id.startsWith('guest_')).toBe(true);

      globalThis.crypto = origCrypto;
    });
  });

  describe('createInitialGuestProfile', () => {
    it('creates profile VO with default empty nickname and non-admin status', () => {
      const fixedTime = '2026-10-10T00:00:00.000Z';
      const profile = createInitialGuestProfile('profile-1', fixedTime);

      expect(profile).toEqual({
        profileId: 'profile-1',
        nickname: '',
        userId: 'profile-1',
        createdAt: fixedTime,
        isAdmin: false,
      });
    });
  });

  describe('createLocalAnonymousSession', () => {
    it('creates session VO with anonymous loginType', () => {
      const fixedTime = '2026-10-10T00:00:00.000Z';
      const session = createLocalAnonymousSession('profile-1', fixedTime);

      expect(session).toEqual({
        userId: 'profile-1',
        isAdmin: false,
        loginTime: fixedTime,
        loginType: 'anonymous',
      });
    });
  });

  describe('getAuthLoginButtonText', () => {
    it('returns Toss text when isToss is true', () => {
      expect(getAuthLoginButtonText(true)).toBe('토스로 3초 만에 시작하기');
    });

    it('returns Google text when isToss is false', () => {
      expect(getAuthLoginButtonText(false)).toBe('구글로 3초 만에 시작하기');
    });
  });
});
