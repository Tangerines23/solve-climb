import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { useUserStore } from '../stores/useUserStore';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { useToastStore } from '../stores/useToastStore';
import { SegmentedControl } from '@/components/SegmentedControl';
import { getItemEmoji, ITEM_LIST, ItemMetadata } from '@/constants/items';
import { UI_MESSAGES, UI_EMOJIS } from '@/constants/ui';
import './ShopPage.css';

// DB 데이터가 없을 때를 대비한 기본 아이템 데이터는 이제 constants/items.ts의 ITEM_LIST를 사용합니다.

export function ShopPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState<{ id: number; message: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'shop' | 'bag'>('shop');
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

        if (error) {
          console.error('Error fetching items:', error);
          setItems(ITEM_LIST);
        } else if (!data || data.length === 0) {
          setItems(ITEM_LIST);
        } else {
          setItems(data);
        }
      } catch (err) {
        console.error('Fetch items crash:', err);
        if (isMounted) setItems(ITEM_LIST);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchItems();
    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount

  const handlePurchase = async (itemId: number, price: number) => {
    if (minerals < price) {
      setPurchaseStatus({ id: itemId, message: UI_MESSAGES.INSUFFICIENT_MINERALS });
      setTimeout(() => setPurchaseStatus(null), 2000);
      return;
    }

    setIsLoading(true);
    try {
      // 1. RPC 호출 시도
      const { data, error } = await safeSupabaseQuery(
        supabase.rpc('purchase_item', { p_item_id: itemId })
      );

      if (error) throw error;

      if (data?.success) {
        setPurchaseStatus({ id: itemId, message: UI_MESSAGES.PURCHASE_SUCCESS });
        await fetchUserData(); // Update minerals and inventory
      } else {
        setPurchaseStatus({ id: itemId, message: data?.message || UI_MESSAGES.PURCHASE_FAILED });
      }
    } catch (err: unknown) {
      console.error('Purchase failed:', err);

      // [오프라인/심사 대응] 네트워크 에러 또는 RPC를 찾을 수 없는 경우 시뮬레이션 모드로 처리
      const errObj = err instanceof Error ? err : { message: '', code: '' };
      if (
        (errObj as { message?: string; code?: string }).message?.includes('Failed to fetch') ||
        (errObj as { message?: string; code?: string }).code === 'PGRST202'
      ) {
        console.warn('[ShopPage] Switching to simulation mode for purchase');

        // 로컬 상태 강제 업데이트 (미네랄 감소 및 인벤토리 메시지)
        // 실제 로직은 useUserStore에서 처리하도록 위임 권장하나, 여기서는 UI 피드백 위주
        setPurchaseStatus({ id: itemId, message: UI_MESSAGES.PURCHASE_SUCCESS_SIMULATION });

        // 미네랄 강제 차감 (로컬)
        const { setMinerals } = useUserStore.getState();
        await setMinerals(minerals - price);

        // 알림 메시지
        showToast('네트워크 연결이 없어 로컬 모드로 구매되었습니다.', 'info');

        // 2초 후 갱신 (실제 인벤토리는 fetchUserData가 실패하겠지만, UI는 갱신됨)
        setTimeout(() => fetchUserData(), 500);
      } else {
        setPurchaseStatus({ id: itemId, message: UI_MESSAGES.COMMON_ERROR });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setPurchaseStatus(null), 2000);
    }
  };

  const handleMineralsAdRecharge = async () => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    showToast(UI_MESSAGES.AD_LOADING, 'info');

    const result = await recoverMineralsAds();
    if (result.success) {
      showToast(result.message, '💎');
    }
    setIsAdLoading(false);
  };

  const getOwnedCount = (code: string) => {
    const item = inventory.find((i) => i.code === code);
    return item ? item.quantity : 0;
  };

  return (
    <div className="shop-page">
      <Header />
      <main className="shop-content">
        <header className="shop-header">
          <button className="btn-icon back-button" onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>마운틴 스토어</h2>
          <div className="user-minerals">
            <span role="img" aria-label="minerals">
              {UI_EMOJIS.MINERAL}
            </span>{' '}
            {minerals.toLocaleString()}
          </div>
        </header>

        <div className="shop-tabs-wrapper">
          <SegmentedControl
            options={[
              { value: 'shop', label: UI_MESSAGES.SHOP_TAB_STORE },
              { value: 'bag', label: UI_MESSAGES.SHOP_TAB_BAG },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'shop' | 'bag')}
          />
        </div>

        {activeTab === 'bag' ? (
          <div className="inventory-view fade-in">
            <div className="inventory-header">
              <span className="inventory-logo">🎒</span>
              <div className="inventory-titles">
                <h3>{UI_MESSAGES.MY_BAG}</h3>
                <p className="hint">{UI_MESSAGES.PREPARE_CLIMB}</p>
              </div>
            </div>
            <div className="inventory-list">
              {inventory?.length > 0 ? (
                inventory.map((item) => (
                  <div key={item?.id} className="inventory-item">
                    <span className="inventory-icon">{getItemEmoji(item?.code || '')}</span>
                    <div className="inventory-item-info">
                      <span className="inventory-name">{item?.name}</span>
                      <span className="inventory-qty">x{item?.quantity}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-inventory">
                  <p>{UI_MESSAGES.EMPTY_BAG}</p>
                  <span>{UI_MESSAGES.PREPARE_CLIMB}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {isLoading && items.length === 0 ? (
              <div className="loading">상점 물건을 진열 중...</div>
            ) : (
              <div className="item-grid fade-in">
                {/* 광고 보상 섹션 */}
                <div className="ad-reward-card">
                  <div className="ad-reward-icon">🎁</div>
                  <div className="ad-reward-info">
                    <h3>{UI_MESSAGES.FREE_MINERAL_RECHARGE}</h3>
                    <p>{UI_MESSAGES.RECV_500_MINERALS}</p>
                  </div>
                  <button
                    className="ad-reward-button"
                    onClick={handleMineralsAdRecharge}
                    disabled={isAdLoading}
                  >
                    {isAdLoading ? UI_MESSAGES.AD_WATCHING : UI_MESSAGES.WATCH_AD}
                  </button>
                </div>

                {items.map((item) => {
                  const owned = getOwnedCount(item.code);
                  return (
                    <div key={item.id} className="item-card card-interactive" data-vg-ignore="true">
                      <div className="item-icon-wrapper">
                        <div className="item-icon">{getItemEmoji(item.code)}</div>
                        {owned > 0 && (
                          <div className="owned-badge">{UI_MESSAGES.OWNED_COUNT(owned)}</div>
                        )}
                      </div>
                      <div className="item-info" data-vg-ignore="true">
                        <div className="item-title-row">
                          <h3>{item.name}</h3>
                        </div>
                        <p className="item-desc">{item.description}</p>
                        <div className="item-footer" data-vg-ignore="true">
                          <span className="item-price">
                            <span role="img" aria-label="minerals">
                              {UI_EMOJIS.MINERAL}
                            </span>{' '}
                            {item.price}
                          </span>
                          <button
                            className="purchase-button"
                            onClick={() => handlePurchase(item.id, item.price)}
                            disabled={isLoading}
                          >
                            {purchaseStatus?.id === item.id ? purchaseStatus.message : '구매하기'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <FooterNav />
    </div>
  );
}
