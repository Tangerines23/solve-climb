import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { SegmentedControl } from '@/components/SegmentedControl';
import { GlassCard } from '@/components/common/GlassCard';
import { useShop } from '@/hooks/useShop';
import { UI_MESSAGES, UI_EMOJIS } from '@/constants/ui';
import './ShopPage.css';

export function ShopPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'shop' | 'bag'>('shop');

  const {
    items,
    isLoading,
    purchaseStatus,
    isAdLoading,
    minerals,
    inventory,
    handlePurchase,
    handleMineralsAdRecharge,
    getOwnedCount,
  } = useShop();

  return (
    <div className="shop-page">
      <Header />
      <main className="shop-content">
        <header className="shop-header">
          <button className="btn-icon back-button" onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>{UI_MESSAGES.SHOP_TITLE}</h2>
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
                  <GlassCard key={item?.id} className="inventory-item">
                    <span className="inventory-icon">
                      {UI_EMOJIS[item?.code?.toUpperCase() as keyof typeof UI_EMOJIS] || '📦'}
                    </span>
                    <div className="inventory-item-info">
                      <span className="inventory-name">{item?.name}</span>
                      <span className="inventory-qty">x{item?.quantity}</span>
                    </div>
                  </GlassCard>
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
              <div className="loading">{UI_MESSAGES.LOADING_SHOP}</div>
            ) : (
              <div className="item-grid fade-in">
                <GlassCard className="ad-reward-card">
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
                </GlassCard>

                {items.map((item) => {
                  const owned = getOwnedCount(item.code);
                  return (
                    <GlassCard key={item.id} className="item-card" data-vg-ignore="true">
                      <div className="item-icon-wrapper">
                        <div className="item-icon">
                          {UI_EMOJIS[item.code.toUpperCase() as keyof typeof UI_EMOJIS] || '📦'}
                        </div>
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
                            {purchaseStatus?.id === item.id
                              ? purchaseStatus.message
                              : UI_MESSAGES.PURCHASE}
                          </button>
                        </div>
                      </div>
                    </GlassCard>
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
