import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useUserStore } from '@/stores/useUserStore';

export interface ItemDefinition {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export function useItemDebugBridge() {
  const { inventory, fetchUserData, consumeItem } = useUserStore();
  const [itemDefinitions, setItemDefinitions] = useState<ItemDefinition[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [usingItemId, setUsingItemId] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('items')
        .select('id, code, name, description')
        .order('id');

      if (error) throw error;
      setItemDefinitions(data || []);
    } catch (err) {
      setMessage({
        type: 'error',
        text: `아이템 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    // 인벤토리 변경 시 입력 필드 업데이트
    const quantities: Record<number, string> = {};
    inventory.forEach((item: any) => {
      quantities[item.id] = item.quantity.toString();
    });
    setItemQuantities(quantities);
  }, [inventory]);

  const handleQuantityChange = useCallback((itemId: number, delta: number) => {
    setItemQuantities((prev) => {
      const raw = Reflect.get(prev, itemId) || '0';
      const current = parseInt(raw, 10);
      const newValue = Math.max(0, current + delta);
      return { ...prev, [itemId]: newValue.toString() };
    });
  }, []);

  const handleQuantityInputChange = useCallback((itemId: number, value: string) => {
    setItemQuantities((prev) => ({ ...prev, [itemId]: value }));
  }, []);

  const handleQuantityInputBlur = useCallback(
    (itemId: number) => {
      setItemQuantities((prev) => {
        const raw = Reflect.get(prev, itemId) || '0';
        const numValue = parseInt(raw, 10);
        if (isNaN(numValue) || numValue < 0) {
          const currentItem = inventory.find((item: any) => item.id === itemId);
          return { ...prev, [itemId]: (currentItem?.quantity || 0).toString() };
        }
        return prev;
      });
    },
    [inventory]
  );

  const handleSetQuantity = useCallback(
    async (itemId: number) => {
      if (isUpdating) return;

      const raw = Reflect.get(itemQuantities, itemId) || '0';
      const numValue = parseInt(raw, 10);
      if (isNaN(numValue) || numValue < 0) {
        setMessage({ type: 'error', text: '유효한 수량을 입력하세요.' });
        return;
      }

      try {
        setIsUpdating(true);
        setMessage(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setMessage({ type: 'error', text: '로그인이 필요합니다.' });
          return;
        }
        const user = session.user;

        const currentItem = inventory.find((item: any) => item.id === itemId);
        const currentQuantity = currentItem?.quantity || 0;
        const quantityDiff = numValue - currentQuantity;

        if (quantityDiff === 0) {
          setMessage({ type: 'success', text: '수량이 변경되지 않았습니다.' });
          return;
        }

        const { data, error } = await supabase.rpc('debug_set_inventory_quantity', {
          p_user_id: user.id,
          p_item_id: itemId,
          p_quantity: numValue,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || '수량 설정 실패');

        setMessage({ type: 'success', text: `아이템 수량이 ${numValue}개로 설정되었습니다.` });
        await fetchUserData();
      } catch (err) {
        setMessage({
          type: 'error',
          text: `아이템 조작 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, itemQuantities, inventory, fetchUserData]
  );

  const handleResetInventory = useCallback(async () => {
    if (isUpdating) return;
    if (!confirm('인벤토리를 초기화하시겠습니까?')) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const { data, error } = await supabase.rpc('debug_reset_inventory', {
        p_user_id: user.id,
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message || '인벤토리 초기화 실패');

      setMessage({ type: 'success', text: '인벤토리가 초기화되었습니다.' });
      await fetchUserData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `인벤토리 초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, fetchUserData]);

  const handleRestoreShopItems = useCallback(async () => {
    if (isUpdating) return;
    if (
      !confirm(
        '상점 아이템 데이터베이스를 강제 복구하시겠습니까?\n(items 테이블의 데이터가 없거나 유실된 경우에만 실행하세요)'
      )
    )
      return;

    try {
      setIsUpdating(true);
      setMessage({ type: 'info', text: '상점 복구 중...' });

      const { data, error } = await supabase.rpc('restore_default_items');

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `상점 아이템 ${(data as any).restored_count}개가 성공적으로 복구/업데이트되었습니다!`,
      });
      await loadItems();
    } catch (err) {
      setMessage({
        type: 'error',
        text: `상점 복구 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, loadItems]);

  const handleUseItem = useCallback(
    async (itemId: number) => {
      if (usingItemId === itemId || isUpdating) return;

      const currentItem = inventory.find((item) => item.id === itemId);
      if (!currentItem || currentItem.quantity <= 0) {
        setMessage({ type: 'error', text: '사용할 수 있는 아이템이 없습니다.' });
        return;
      }

      try {
        setUsingItemId(itemId);
        setMessage(null);

        const result = await consumeItem(itemId);

        if (result.success) {
          setMessage({ type: 'success', text: `${currentItem.name} 아이템을 사용했습니다.` });
          await fetchUserData();
        } else {
          setMessage({
            type: 'error',
            text: `아이템 사용 실패: ${result.message || '알 수 없는 오류'}`,
          });
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: `아이템 사용 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        });
      } finally {
        setUsingItemId(null);
      }
    },
    [usingItemId, isUpdating, inventory, consumeItem, fetchUserData]
  );

  return {
    itemDefinitions,
    itemQuantities,
    inventory,
    isLoading,
    isUpdating,
    message,
    usingItemId,
    handleQuantityChange,
    handleQuantityInputChange,
    handleQuantityInputBlur,
    handleSetQuantity,
    handleResetInventory,
    handleRestoreShopItems,
    handleUseItem,
  };
}
