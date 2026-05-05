import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { useUserStore } from '@/stores/useUserStore';
import { useToastStore } from '@/stores/useToastStore';
import { ITEM_LIST, ItemMetadata } from '@/constants/items';
import { UI_MESSAGES, STATUS_TYPES } from '@/constants/ui';
import { ANIMATION_CONFIG } from '@/features/quiz';

export function useShop() {
  const [items, setItems] = useState<ItemMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState<{ id: number; message: string } | null>(
    null
  );
  const [isAdLoading, setIsAdLoading] = useState(false);

  const { minerals, inventory, fetchUserData, recoverMineralsAds } = useUserStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    let isMounted = true;

    async function fetchItems() {
      setIsLoading(true);
      try {
        const { data, error } = await safeSupabaseQuery(
          supabase.from('items').select('*').order('id', { ascending: true })
        );

        if (!isMounted) return;

        if (error || !data || data.length === 0) {
          setItems(ITEM_LIST);
        } else {
          setItems(data);
        }
      } catch (err) {
        console.error('[useShop] Fetch items crash:', err);
        showToast(UI_MESSAGES.FETCH_DATA_FAILED, 'error');
        if (isMounted) setItems(ITEM_LIST);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchItems();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handlePurchase = useCallback(
    async (itemId: number, price: number) => {
      if (minerals < price) {
        setPurchaseStatus({ id: itemId, message: UI_MESSAGES.INSUFFICIENT_MINERALS });
        setTimeout(() => setPurchaseStatus(null), ANIMATION_CONFIG.TOAST_DURATION);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await safeSupabaseQuery(
          supabase.rpc('purchase_item', { p_item_id: itemId })
        );

        if (error) throw error;

        if (data?.success) {
          setPurchaseStatus({ id: itemId, message: UI_MESSAGES.PURCHASE_SUCCESS });
          await fetchUserData();
        } else {
          setPurchaseStatus({ id: itemId, message: data?.message || UI_MESSAGES.PURCHASE_FAILED });
        }
      } catch (err: unknown) {
        console.error('[useShop] Purchase failed:', err);

        const error = err as { message?: string; code?: string };
        // Simulation mode for offline/local development
        if (error?.message?.includes('Failed to fetch') || error?.code === 'PGRST202') {
          setPurchaseStatus({ id: itemId, message: UI_MESSAGES.PURCHASE_SUCCESS_SIMULATION });
          const { setMinerals } = useUserStore.getState();
          await setMinerals(minerals - price);
          showToast(UI_MESSAGES.LOCAL_PURCHASE_INFO, STATUS_TYPES.INFO);
          setTimeout(() => fetchUserData(), 500);
        } else {
          setPurchaseStatus({ id: itemId, message: UI_MESSAGES.COMMON_ERROR });
        }
      } finally {
        setIsLoading(false);
        setTimeout(() => setPurchaseStatus(null), ANIMATION_CONFIG.TOAST_DURATION);
      }
    },
    [minerals, showToast, fetchUserData]
  );

  const handleMineralsAdRecharge = useCallback(async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    showToast(UI_MESSAGES.AD_LOADING, STATUS_TYPES.INFO);

    const result = await recoverMineralsAds();
    if (result.success) {
      showToast(result.message || UI_MESSAGES.REWARD_EARNED, '💎');
    } else {
      showToast(result.message || UI_MESSAGES.AD_LOAD_FAILED, STATUS_TYPES.ERROR);
    }
    setIsAdLoading(false);
  }, [isAdLoading, showToast, recoverMineralsAds]);

  const getOwnedCount = (code: string) => {
    const item = inventory.find((i) => i.code === code);
    return item ? item.quantity : 0;
  };

  return {
    items,
    isLoading,
    purchaseStatus,
    isAdLoading,
    minerals,
    inventory,
    handlePurchase,
    handleMineralsAdRecharge,
    getOwnedCount,
  };
}
