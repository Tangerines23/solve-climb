import { describe, it, expect } from 'vitest';
import {
  validatedRpc,
  CommonResponseSchema,
  CheckAndAwardBadgesResponseSchema,
  ItemActionResponseSchema,
} from '../rpcValidator';

describe('rpcValidator', () => {
  describe('validatedRpc', () => {
    it('should return data when validation succeeds', async () => {
      const mockRpc = Promise.resolve({
        data: { success: true, message: 'OK' },
        error: null,
      });

      const result = await validatedRpc(mockRpc, CommonResponseSchema, 'test_rpc');

      expect(result.data).toEqual({ success: true, message: 'OK' });
      expect(result.error).toBeNull();
    });

    it('should return error when RPC returns an error', async () => {
      const mockRpc = Promise.resolve({
        data: null,
        error: { message: 'Database Error' },
      });

      const result = await validatedRpc(mockRpc, CommonResponseSchema, 'test_rpc');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'Database Error' });
    });

    it('should return validation error when schema parsing fails', async () => {
      const mockRpc = Promise.resolve({
        data: { success: 'not-a-boolean' },
        error: null,
      });

      const result = await validatedRpc(mockRpc, CommonResponseSchema, 'test_rpc');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect((result.error as { message?: string }).message).toContain('데이터 검증 실패');
    });

    it('should handle missing data', async () => {
      const mockRpc = Promise.resolve({
        data: null,
        error: null,
      });

      const result = await validatedRpc(mockRpc, CommonResponseSchema, 'test_rpc');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('CheckAndAwardBadgesResponseSchema', () => {
    it('should default success to true', () => {
      const data = { awarded_badges: ['badge1'], count: 1 };
      const parsed = CheckAndAwardBadgesResponseSchema.parse(data);
      expect(parsed.success).toBe(true);
    });

    it('should transform null count to 0', () => {
      const data = { awarded_badges: [], count: null };
      const parsed = CheckAndAwardBadgesResponseSchema.parse(data);
      expect(parsed.count).toBe(0);
    });
  });

  describe('ItemActionResponseSchema', () => {
    it('should parse valid response with optional fields', () => {
      const data = { success: true, remaining_minerals: 100, new_quantity: 5 };
      const parsed = ItemActionResponseSchema.parse(data);
      expect(parsed.remaining_minerals).toBe(100);
      expect(parsed.new_quantity).toBe(5);
    });
  });
});
