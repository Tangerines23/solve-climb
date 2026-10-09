import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { safeSupabaseQuery } from '@/utils/debugFetch';
import { useUserStore } from '@/stores/useUserStore';
import { useToastStore } from '@/stores/useToastStore';
import { ITEM_LIST, ItemMetadata } from '@/constants/items';
import { UI_MESSAGES, STATUS_TYPES } from '@/constants/ui';
import { ANIMATION_CONFIG } from '@/constants/game';
import { logError } from '@/utils/errorHandler';
import { addOrIncrementItem, getInventoryQuantity, isSimulationError } from '../utils/shopUtils';

export function useShop() {
  const [items, setItems] = useState<ItemMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState<{ id: number; message: string } | null>(
    null
  );
  const [isAdLoading, setIsAdLoading] = useState(false);
  const isMountedRef = useRef(true);
  const isPurchasingRef = useRef(false);
  const isAdRechargingRef = useRef(false);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { minerals, inventory, fetchUserData, recoverMineralsAds } = useUserStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    isMountedRef.current = true;

    async function fetchItems() {
      setIsLoading(true);
      try {
        const { data, error } = await safeSupabaseQuery(
          supabase.from('items').select('*').order('id', { ascending: true })
        );

        if (!isMountedRef.current) return;

        if (error || !data || data.length === 0) {
          setItems(ITEM_LIST);
          return;
        }
        setItems(data);
      } catch (err) {
        logError('useShop#fetchItems', err);
        showToast(UI_MESSAGES.FETCH_DATA_FAILED, 'error');
        if (isMountedRef.current) setItems(ITEM_LIST);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    }

    fetchItems();
    return () => {
      isMountedRef.current = false;
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [showToast]);

  const scheduleStatusReset = useCallback(() => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setPurchaseStatus(null);
      }
    }, ANIMATION_CONFIG.TOAST_DURATION);
  }, []);

  const handlePurchase = useCallback(
    async (itemId: number, price: number) => {
      // Concurrency lock: prevent duplicate simultaneous purchase requests
      if (isPurchasingRef.current) return;
      isPurchasingRef.current = true;

      if (minerals < price) {
        setPurchaseStatus({ id: itemId, message: UI_MESSAGES.INSUFFICIENT_MINERALS });
        scheduleStatusReset();
        isPurchasingRef.current = false;
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
          return;
        }

        setPurchaseStatus({ id: itemId, message: data?.message || UI_MESSAGES.PURCHASE_FAILED });
      } catch (err: unknown) {
        logError('useShop#purchase', err);

        // Simulation mode for offline/local development
        if (isSimulationError(err)) {
          setPurchaseStatus({ id: itemId, message: UI_MESSAGES.PURCHASE_SUCCESS_SIMULATION });
          const { setMinerals } = useUserStore.getState();
          await setMinerals(minerals - price);
          const targetItem = items.find((i) => i.id === itemId);
          if (targetItem) {
            useUserStore.setState((state) => ({
              inventory: addOrIncrementItem(state.inventory, targetItem, itemId),
            }));
          }
          showToast(UI_MESSAGES.LOCAL_PURCHASE_INFO, STATUS_TYPES.INFO);
          setTimeout(() => {
            if (isMountedRef.current) fetchUserData();
          }, 500);
          return;
        }

        setPurchaseStatus({ id: itemId, message: UI_MESSAGES.COMMON_ERROR });
      } finally {
        isPurchasingRef.current = false;
        if (isMountedRef.current) {
          setIsLoading(false);
          scheduleStatusReset();
        }
      }
    },
    [minerals, items, showToast, fetchUserData, scheduleStatusReset]
  );

  const handleMineralsAdRecharge = useCallback(async () => {
    if (isAdRechargingRef.current || isAdLoading) return;
    isAdRechargingRef.current = true;
    setIsAdLoading(true);
    showToast(UI_MESSAGES.AD_LOADING, STATUS_TYPES.INFO);

    try {
      const result = await recoverMineralsAds();
      if (!isMountedRef.current) return;

      if (result.success) {
        showToast(result.message || UI_MESSAGES.REWARD_EARNED, '💎');
        return;
      }

      showToast(result.message || UI_MESSAGES.AD_LOAD_FAILED, STATUS_TYPES.ERROR);
    } catch (err) {
      logError('useShop#handleMineralsAdRecharge', err);
      if (isMountedRef.current) {
        showToast(UI_MESSAGES.AD_LOAD_FAILED, STATUS_TYPES.ERROR);
      }
    } finally {
      isAdRechargingRef.current = false;
      if (isMountedRef.current) {
        setIsAdLoading(false);
      }
    }
  }, [isAdLoading, showToast, recoverMineralsAds]);

  const getOwnedCount = useCallback(
    (code: string) => getInventoryQuantity(inventory, code),
    [inventory]
  );

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
