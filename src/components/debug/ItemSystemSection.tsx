import React from 'react';
import { useItemDebugBridge } from '@/features/quiz/hooks/bridge/useItemDebugBridge';
import { ITEM_MAP } from '@/constants/items';

export const ItemSystemSection: React.FC = () => {
  const {
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
  } = useItemDebugBridge();

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 animate-pulse flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-blue-400 text-lg font-medium mb-4">아이템 불러오는 중...</div>
        <div className="h-7 w-40 bg-gray-800 rounded-lg mb-6"></div>
        <div className="space-y-4 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-800/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">📦</span> 아이템 시스템
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition-all active:scale-95 disabled:opacity-50"
            onClick={handleResetInventory}
            disabled={isUpdating}
          >
            🗑️ 인벤토리 초기화
          </button>
          <button
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg border border-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
            onClick={handleRestoreShopItems}
            disabled={isUpdating}
          >
            🏪 상점 복구
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {itemDefinitions.map((item: any) => {
          const currentItem = inventory.find((inv: any) => inv.id === item.id);
          const currentQuantity = currentItem?.quantity || 0;
          const inputValue = itemQuantities[item.id] ?? currentQuantity.toString();
          const meta = ITEM_MAP[item.code];

          return (
            <div
              key={item.id}
              className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-blue-500/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{meta?.emoji || '📦'}</span>
                  <span className="font-semibold text-gray-100">{item.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full">
                    ID: {item.id}
                  </span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-1">
                  {item.description || meta?.description || '설명 없음'}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-lg border border-gray-700/30">
                <div className="flex items-center">
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-l transition-colors disabled:opacity-50"
                    onClick={() => handleQuantityChange(item.id, -5)}
                    disabled={isUpdating}
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    className="w-16 h-8 bg-gray-800 text-center text-white border-x border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={inputValue}
                    onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                    onBlur={() => handleQuantityInputBlur(item.id)}
                    disabled={isUpdating}
                  />
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-r transition-colors disabled:opacity-50"
                    onClick={() => handleQuantityChange(item.id, 5)}
                    disabled={isUpdating}
                  >
                    +5
                  </button>
                </div>

                <div className="flex gap-2 border-l border-gray-700 pl-3">
                  <button
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-all active:scale-95 disabled:opacity-50"
                    onClick={() => handleSetQuantity(item.id)}
                    disabled={isUpdating}
                  >
                    설정
                  </button>
                  {currentQuantity > 0 && (
                    <button
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm font-medium rounded border border-purple-500/30 transition-all active:scale-95 disabled:opacity-50"
                      onClick={() => handleUseItem(item.id)}
                      disabled={isUpdating || usingItemId === item.id}
                    >
                      {usingItemId === item.id ? '...' : '사용'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div
          className={`mt-6 p-4 rounded-lg border text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : message.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};
