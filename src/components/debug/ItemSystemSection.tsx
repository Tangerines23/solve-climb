import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useUserStore } from '../../stores/useUserStore';
import './ItemSystemSection.css';

interface ItemDefinition {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export function ItemSystemSection() {
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

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    // 인벤토리 변경 시 입력 필드 업데이트
    const quantities: Record<number, string> = {};
    inventory.forEach((item) => {
      quantities[item.id] = item.quantity.toString();
    });
    setItemQuantities(quantities);
  }, [inventory]);

  const loadItems = async () => {
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
  };

  const handleQuantityChange = (itemId: number, delta: number) => {
    const raw = Object.prototype.hasOwnProperty.call(itemQuantities, itemId)
      ? // eslint-disable-next-line security/detect-object-injection -- key validated above
        itemQuantities[itemId]
      : '0';
    const current = parseInt(raw || '0', 10);
    const newValue = Math.max(0, current + delta);
    setItemQuantities((prev) => ({ ...prev, [itemId]: newValue.toString() }));
  };

  const handleQuantityInputChange = (itemId: number, value: string) => {
    setItemQuantities((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleQuantityInputBlur = (itemId: number) => {
    const raw = Object.prototype.hasOwnProperty.call(itemQuantities, itemId)
      ? // eslint-disable-next-line security/detect-object-injection -- key validated above
        itemQuantities[itemId]
      : '0';
    const numValue = parseInt(raw || '0', 10);
    if (isNaN(numValue) || numValue < 0) {
      const currentItem = inventory.find((item) => item.id === itemId);
      setItemQuantities((prev) => ({ ...prev, [itemId]: (currentItem?.quantity || 0).toString() }));
    }
  };

  const handleSetQuantity = async (itemId: number) => {
    if (isUpdating) return;

    const raw = Object.prototype.hasOwnProperty.call(itemQuantities, itemId)
      ? // eslint-disable-next-line security/detect-object-injection -- key validated above
        itemQuantities[itemId]
      : '0';
    const numValue = parseInt(raw || '0', 10);
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

      // 현재 인벤토리에서 해당 아이템 찾기
      const currentItem = inventory.find((item) => item.id === itemId);
      const currentQuantity = currentItem?.quantity || 0;
      const quantityDiff = numValue - currentQuantity;

      if (quantityDiff === 0) {
        setMessage({ type: 'success', text: '수량이 변경되지 않았습니다.' });
        return;
      }

      // 보안 RPC를 통해 수량 설정 (Insert/Update/Delete 통합 처리)
      const { error } = await supabase.rpc('debug_set_inventory_quantity', {
        p_user_id: user.id,
        p_item_id: itemId,
        p_quantity: numValue,
      });

      if (error) throw error;
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
  };

  const handleResetInventory = async () => {
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

      const { error } = await supabase.rpc('debug_reset_inventory', {
        p_user_id: user.id,
      });

      if (error) throw error;

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
  };

  const handleRestoreShopItems = async () => {
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

      // 서버 사이드 RPC 호출로 안전하게 복구
      const { data, error } = await supabase.rpc('restore_default_items');

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `상점 아이템 ${data.restored_count}개가 성공적으로 복구/업데이트되었습니다!`,
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
  };

  const handleUseItem = async (itemId: number) => {
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
  };

  if (isLoading) {
    return (
      <div className="debug-section">
        <div className="debug-loading">아이템 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="debug-section">
      <h3 className="debug-section-title">📦 아이템 시스템</h3>

      <div className="debug-item-controls">
        <button
          className="debug-item-reset-button"
          onClick={handleResetInventory}
          disabled={isUpdating}
        >
          🎒 인벤토리 초기화
        </button>
        <button
          className="debug-item-restore-button"
          onClick={handleRestoreShopItems}
          disabled={isUpdating}
        >
          🏪 상점 물품 긴급 복구
        </button>
      </div>

      <div className="debug-item-list">
        {itemDefinitions.map((item) => {
          const currentItem = inventory.find((inv) => inv.id === item.id);
          const currentQuantity = currentItem?.quantity || 0;
          const inputValue = itemQuantities[item.id] ?? currentQuantity.toString();

          return (
            <div key={item.id} className="debug-item-item">
              <div className="debug-item-info">
                <label htmlFor={`debug-item-input-${item.id}`} className="debug-item-name">
                  {item.name}
                </label>
                {item.description && (
                  <div className="debug-item-description">{item.description}</div>
                )}
              </div>
              <div className="debug-item-control">
                <button
                  className="debug-item-button-small"
                  onClick={() => handleQuantityChange(item.id, -5)}
                  disabled={isUpdating}
                >
                  -5
                </button>
                <input
                  type="number"
                  id={`debug-item-input-${item.id}`}
                  name={`item-${item.id}`}
                  className="debug-item-input"
                  value={inputValue}
                  onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                  onBlur={() => handleQuantityInputBlur(item.id)}
                  min="0"
                  disabled={isUpdating}
                />
                <button
                  className="debug-item-button-small"
                  onClick={() => handleQuantityChange(item.id, 5)}
                  disabled={isUpdating}
                >
                  +5
                </button>
                <button
                  className="debug-item-button"
                  onClick={() => handleSetQuantity(item.id)}
                  disabled={isUpdating}
                >
                  설정
                </button>
                {currentQuantity > 0 && (
                  <button
                    className="debug-item-use-button"
                    onClick={() => handleUseItem(item.id)}
                    disabled={isUpdating || usingItemId === item.id}
                  >
                    {usingItemId === item.id ? '사용 중...' : '즉시 사용'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}
