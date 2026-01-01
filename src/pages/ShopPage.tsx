import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useUserStore } from '../stores/useUserStore';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import './ShopPage.css';

interface Item {
  id: number;
  code: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

export function ShopPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState<{ id: number; message: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'shop' | 'bag'>('shop');
  const { minerals, inventory, fetchUserData } = useUserStore();

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching items:', error);
      } else {
        setItems(data || []);
      }
      setIsLoading(false);
    }

    fetchItems();
  }, []);

  const handlePurchase = async (itemId: number, price: number) => {
    if (minerals < price) {
      setPurchaseStatus({ id: itemId, message: '미네랄이 부족합니다!' });
      setTimeout(() => setPurchaseStatus(null), 2000);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('purchase_item', { p_item_id: itemId });

      if (error) throw error;

      if (data.success) {
        setPurchaseStatus({ id: itemId, message: '구매 완료! 🎒' });
        await fetchUserData(); // Update minerals and inventory
      } else {
        setPurchaseStatus({ id: itemId, message: data.message || '구매 실패' });
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      setPurchaseStatus({ id: itemId, message: '오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setPurchaseStatus(null), 2000);
    }
  };

  const getItemEmoji = (code: string) => {
    switch (code) {
      case 'oxygen_tank':
        return '🧪';
      case 'power_gel':
        return '⚡';
      case 'safety_rope':
        return '🛡️'; // Match centralized icon
      case 'flare':
        return '🧨';
      case 'last_spurt':
        return '🔥';
      default:
        return '📦';
    }
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
          <button className="back-button" onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>마운틴 스토어</h2>
          <div className="user-minerals">
            <span role="img" aria-label="minerals">
              💎
            </span>{' '}
            {minerals.toLocaleString()}
          </div>
        </header>

        <div className="shop-tabs">
          <button
            className={`tab-button ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            ⛰️ 상점
          </button>
          <button
            className={`tab-button ${activeTab === 'bag' ? 'active' : ''}`}
            onClick={() => setActiveTab('bag')}
          >
            🎒 내 배낭
          </button>
        </div>

        {activeTab === 'bag' ? (
          <div className="inventory-view fade-in">
            <div className="inventory-header">
              <span className="inventory-logo">🎒</span>
              <div className="inventory-titles">
                <h3>나의 배낭</h3>
                <p className="hint">보유 중인 아이템입니다.</p>
              </div>
            </div>
            <div className="inventory-list">
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <div key={item.id} className="inventory-item">
                    <span className="inventory-icon">{getItemEmoji(item.code)}</span>
                    <div className="inventory-item-info">
                      <span className="inventory-name">{item.name}</span>
                      <span className="inventory-qty">x{item.quantity}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-inventory">
                  <p>배낭이 비어있습니다.</p>
                  <span>아이템을 구매하여 등반을 준비하세요!</span>
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
                {items.map((item) => {
                  const owned = getOwnedCount(item.code);
                  return (
                    <div key={item.id} className="item-card">
                      <div className="item-icon-wrapper">
                        <div className="item-icon">{getItemEmoji(item.code)}</div>
                        {owned > 0 && <div className="owned-badge">보유 {owned}</div>}
                      </div>
                      <div className="item-info">
                        <div className="item-title-row">
                          <h3>{item.name}</h3>
                        </div>
                        <p className="item-desc">{item.description}</p>
                        <div className="item-footer">
                          <span className="item-price">
                            <span role="img" aria-label="minerals">
                              💎
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
