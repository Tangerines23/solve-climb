import { z } from 'zod';

/**
 * RPC 응답 검증용 공통 스키마 정의
 */

/** check_and_award_badges 응답 스키마 */
export const CheckAndAwardBadgesResponseSchema = z.object({
  success: z.boolean(),
  awarded_badges: z.array(z.string()),
  count: z.number(),
});

// 1. 공통 성공/실패 응답
export const CommonResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

// 2. 아이템 구매/사용 응답
export const ItemActionResponseSchema = CommonResponseSchema.extend({
  remaining_minerals: z.number().optional(),
  new_quantity: z.number().optional(),
});


// 4. 랭킹 데이터 응답 (get_ranking_v2)
export const RankingRecordSchema = z.object({
  user_id: z.string(),
  nickname: z.string(),
  score: z.number(),
  rank: z.number(),
  week_start_date: z.string().optional(),
  tier_level: z.number().optional(),
  tier_stars: z.number().optional(),
});
export const RankingListSchema = z.array(RankingRecordSchema);

// 5. 게임 결과 제출 응답 (submit_game_result)



/**
 * RPC 응답을 Zod 스키마로 검증하는 유틸리티
 * @param rpcPromise Supabase RPC 호출 프라미스
 * @param schema 검증할 Zod 스키마
 * @param rpcName 디버깅용 RPC 이름
 */
export async function validatedRpc<T>(
  rpcPromise: PromiseLike<{ data: any; error: any }>,
  schema: z.ZodSchema<T>,
  rpcName: string
): Promise<{ data: T | null; error: any }> {
  const result = await rpcPromise;

  if (result.error) {
    return result;
  }

  const parseResult = schema.safeParse(result.data);

  if (!parseResult.success) {
    console.error(`❌ [RPC Validation Error] ${rpcName}:`, parseResult.error.format());
    // 개발 모드에서는 에러를 던지거나 상세히 알림, 운영에서는 로그만 남기고 원본 데이터 반환 시도 가능
    // 여기서는 실패 시 null을 반환하여 앱의 오작동을 방지합니다.
    return {
      data: null,
      error: {
        message: `데이터 검증 실패 (${rpcName})`,
        details: parseResult.error.format(),
      },
    };
  }

  return { data: parseResult.data, error: null };
}
