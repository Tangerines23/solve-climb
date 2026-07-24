import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeGoogleSignIn, signInWithGoogle, _resetGoogleSignInInitForTest } from '../auth';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { supabase } from '../supabaseClient';

vi.mock('@capawesome/capacitor-google-sign-in', () => ({
  GoogleSignIn: {
    initialize: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue({ idToken: 'test-id-token' }),
  },
}));

vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithIdToken: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('auth utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetGoogleSignInInitForTest();
    delete (window as any).Capacitor;
  });

  describe('initializeGoogleSignIn', () => {
    it('should skip initialization on web environment', async () => {
      await initializeGoogleSignIn();
      expect(GoogleSignIn.initialize).not.toHaveBeenCalled();
    });

    it('should call GoogleSignIn.initialize on native environment', async () => {
      (window as any).Capacitor = { isNativePlatform: () => true };
      await initializeGoogleSignIn();
      expect(GoogleSignIn.initialize).toHaveBeenCalledWith({
        clientId: expect.any(String),
        scopes: ['profile', 'email'],
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('should use web OAuth flow when on web', async () => {
      await signInWithGoogle();
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          queryParams: expect.objectContaining({ access_type: 'offline' }),
        }),
      });
    });

    it('should initialize and call GoogleSignIn.signIn on native app', async () => {
      (window as any).Capacitor = { isNativePlatform: () => true };
      const result = await signInWithGoogle();

      expect(GoogleSignIn.initialize).toHaveBeenCalled();
      expect(GoogleSignIn.signIn).toHaveBeenCalled();
      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'google',
        token: 'test-id-token',
      });
      expect(result).toEqual({ error: null });
    });
  });
});
