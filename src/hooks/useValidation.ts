import { useCallback } from 'react';
import { safeAccess as safeAccessUtil, sanitizeNickname as sanitizeNicknameUtil, validateNickname as validateNicknameUtil, isValidUUID as isValidUUIDUtil } from '@/utils/validation';

/**
 * Hook for validation and sanitization related operations.
 * Acts as a bridge between UI components and validation utilities.
 */
export function useValidation() {
  /**
   * Safely accesses an object property.
   */
  const safeAccess = useCallback(<T extends object>(
    obj: T | undefined | null,
    key: string | number | null | undefined
  ): unknown | undefined => {
    return safeAccessUtil(obj, key);
  }, []);

  /**
   * Sanitizes a nickname.
   */
  const sanitizeNickname = useCallback((nickname: string): string => {
    return sanitizeNicknameUtil(nickname);
  }, []);

  /**
   * Validates a nickname.
   */
  const validateNickname = useCallback((nickname: string): { valid: boolean; error?: string } => {
    return validateNicknameUtil(nickname);
  }, []);

  /**
   * Checks if a string is a valid UUID.
   */
  const isValidUUID = useCallback((uuid: string | null | undefined): boolean => {
    return isValidUUIDUtil(uuid);
  }, []);

  return {
    safeAccess,
    sanitizeNickname,
    validateNickname,
    isValidUUID,
  };
}
