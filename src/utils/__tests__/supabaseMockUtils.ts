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
export const createAuthSessionMock = (session: any = null, error: any = null): AuthResponse => {
  if (error) {
    return {
      data: { session: null, user: null },
      error,
    } as AuthResponse;
  }
  if (!session) {
    return {
      data: { session: null, user: null },
      error: null,
    } as AuthResponse;
  }
  return {
    data: { session, user: session.user },
    error: null,
  } as any as AuthResponse;
};

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
    name: 'PostgrestError',
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
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResponse),
    maybeSingle: vi.fn().mockResolvedValue(finalResponse),
    csv: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    // To handle the promise-like behavior of Supabase queries
    then: (onfulfilled?: any) => Promise.resolve(finalResponse).then(onfulfilled),
    catch: (onrejected?: any) => Promise.resolve(finalResponse).catch(onrejected),
  };

  // Mock-like helpers
  mock.mockResolvedValue = (val: any) => {
    finalResponse = val;
    return mock;
  };
  mock.mockResolvedValueOnce = (val: any) => {
    finalResponse = val;
    return mock;
  };

  return mock;
};

/**
 * Creates a mock for Supabase auth.getSession() response.
 */
export const createGetSessionMock = (session: any = null) => {
  return {
    data: {
      session,
    },
    error: null,
  };
};
