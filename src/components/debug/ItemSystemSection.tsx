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
  const { inventory, fetchUserData } = useUserStore();
  const [itemDefinitions, setItemDefinitions] = useState<ItemDefinition[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    // 인벤토리 변경 시 입력 필드 업데이트
    const quantities: Record<number, string> = {};
    inventory.forEach(item => {
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
      setMessage({ type: 'error', text: `아이템 로드 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, delta: number) => {
    const current = parseInt(itemQuantities[itemId] || '0', 10);
    const newValue = Math.max(0, current + delta);
    setItemQuantities(prev => ({ ...prev, [itemId]: newValue.toString() }));
  };

  const handleQuantityInputChange = (itemId: number, value: string) => {
    setItemQuantities(prev => ({ ...prev, [itemId]: value }));
  };

  const handleQuantityInputBlur = (itemId: number) => {
    const numValue = parseInt(itemQuantities[itemId] || '0', 10);
    if (isNaN(numValue) || numValue < 0) {
      const currentItem = inventory.find(item => item.id === itemId);
      setItemQuantities(prev => ({ ...prev, [itemId]: (currentItem?.quantity || 0).toString() }));
    }
  };

  const handleSetQuantity = async (itemId: number) => {
    if (isUpdating) return;

    const numValue = parseInt(itemQuantities[itemId] || '0', 10);
    if (isNaN(numValue) || numValue < 0) {
      setMessage({ type: 'error', text: '유효한 수량을 입력하세요.' });
      return;
    }

    try {
      setIsUpdating(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      // 현재 인벤토리에서 해당 아이템 찾기
      const currentItem = inventory.find(item => item.id === itemId);
      const currentQuantity = currentItem?.quantity || 0;
      const quantityDiff = numValue - currentQuantity;

      if (quantityDiff === 0) {
        setMessage({ type: 'success', text: '수량이 변경되지 않았습니다.' });
        return;
      }

      // 인벤토리 업데이트 (직접 업데이트)
      const newQuantity = Math.max(0, numValue);
      
      if (currentQuantity === 0 && newQuantity > 0) {
        // 새 아이템 추가
        const { error } = await supabase
          .from('inventory')
          .insert({
            user_id: user.id,
            item_id: itemId,
            quantity: newQuantity,
          });

        if (error) throw error;
        setMessage({ type: 'success', text: `아이템 ${newQuantity}개가 추가되었습니다.` });
      } else if (newQuantity === 0) {
        // 아이템 제거
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId);

        if (error) throw error;
        setMessage({ type: 'success', text: '아이템이 제거되었습니다.' });
      } else {
        // 수량 업데이트
        const { error } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('user_id', user.id)
          .eq('item_id', itemId);

        if (error) throw error;
        setMessage({ type: 'success', text: `아이템 수량이 ${newQuantity}개로 변경되었습니다.` });
      }

      await fetchUserData();
    } catch (err) {
      setMessage({ type: 'error', text: `아이템 조작 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
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

      const { data: { user } } = await supabase.auth.getSession();
      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다.' });
        return;
      }

      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '인벤토리가 초기화되었습니다.' });
      await fetchUserData();
    } catch (err) {
      setMessage({ type: 'error', text: `인벤토리 초기화 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` });
    } finally {
      setIsUpdating(false);
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
          인벤토리 초기화
        </button>
      </div>

      <div className="debug-item-list">
        {itemDefinitions.map((item) => {
          const currentItem = inventory.find(inv => inv.id === item.id);
          const currentQuantity = currentItem?.quantity || 0;
          const inputValue = itemQuantities[item.id] ?? currentQuantity.toString();

          return (
            <div key={item.id} className="debug-item-item">
              <div className="debug-item-info">
                <div className="debug-item-name">{item.name}</div>
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
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className={`debug-message debug-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

