import { vi } from 'vitest';
import {
  AuthResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
  UserResponse,
} from '@supabase/supabase-js';

/**
 * Creates a typed mock for Supabase Auth User response
 */
export const createAuthUserMock = (user: any = null, error: any = null): UserResponse =>
  ({
    data: { user },
    error,
  }) as UserResponse;

/**
 * Creates a typed mock for Supabase Auth Session response
 */
export const createAuthSessionMock = (session: any = null, error: any = null): AuthResponse =>
  ({
    data: { session, user: session?.user ?? null },
    error,
  }) as AuthResponse;

/**
 * Creates a typed mock for Supabase RPC or Single Row response
 */
export const createSuccessResponse = <T>(data: T): PostgrestSingleResponse<T> => ({
  data,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
});

/**
 * Creates a typed mock for Supabase Error response
 */
export const createErrorResponse = (
  message: string,
  status = 400
): PostgrestSingleResponse<any> => ({
  data: null,
  error: {
    message,
    details: '',
    hint: '',
    code: status.toString(),
  },
  count: null,
  status,
  statusText: 'Error',
});

/**
 * Creates a typed mock for Supabase List response
 */
export const createListResponse = <T>(data: T[]): PostgrestResponse<T> => ({
  data,
  error: null,
  count: data.length,
  status: 200,
  statusText: 'OK',
});

/**
 * Helper to create a chainable mock for supabase.from().select()...
 */
export const createChainableMock = (finalResponse: any) => {
  const mock: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResponse),
    maybeSingle: vi.fn().mockResolvedValue(finalResponse),
    then: (resolve: any) => Promise.resolve(finalResponse).then(resolve),
  };

  // Also support direct calling of the mock as a promise
  mock.mockResolvedValue = (val: any) => {
    finalResponse = val;
    return mock;
  };

  return mock;
};
