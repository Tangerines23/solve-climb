import type { InventoryItem } from '@/types/user';

/**
 * 인벤토리 목록에서 특정 아이템 코드의 수량을 안전하게 조회합니다.
 * - null/undefined 방어 및 음수 수량 0 클램핑 보장
 */
export function getInventoryQuantity(
  inventory: Array<{ code: string; quantity: number }> | null | undefined,
  code: string | null | undefined
): number {
  if (!Array.isArray(inventory) || !code) return 0;
  const item = inventory.find((i) => i && i.code === code);
  return item && typeof item.quantity === 'number' ? Math.max(0, item.quantity) : 0;
}

/**
 * 인벤토리에 아이템을 추가하거나 기존 아이템의 수량을 증가시킵니다.
 * - 불변성(Immutability) 유지 및 음수 수량 방어
 */
export function addOrIncrementItem(
  inventory: InventoryItem[] | null | undefined,
  targetItem: { code: string; name: string; description?: string } | null | undefined,
  itemId: number,
  incrementAmount: number = 1
): InventoryItem[] {
  const safeInventory = Array.isArray(inventory) ? [...inventory] : [];
  if (!targetItem || !targetItem.code) {
    return safeInventory;
  }

  const safeIncrement = Math.max(0, incrementAmount);
  const itemIndex = safeInventory.findIndex((i) => i && i.code === targetItem.code);

  if (itemIndex !== -1) {
    const current = safeInventory[itemIndex];
    safeInventory[itemIndex] = {
      ...current,
      quantity: Math.max(0, (current.quantity || 0) + safeIncrement),
    };
    return safeInventory;
  }

  return [
    ...safeInventory,
    {
      id: itemId,
      code: targetItem.code,
      name: targetItem.name || '',
      description: targetItem.description ?? '',
      quantity: safeIncrement,
    },
  ];
}

/**
 * 오프라인/로컬 개발 환경 및 네트워크 단절 시뮬레이션 에러 판별
 */
export function isSimulationError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'string') {
    return (
      error.includes('Failed to fetch') ||
      error.includes('PGRST202') ||
      error.includes('NetworkError') ||
      error.includes('fetch failed')
    );
  }
  if (typeof error === 'object') {
    const err = error as { message?: unknown; code?: unknown; details?: unknown };
    const message = typeof err.message === 'string' ? err.message : '';
    const details = typeof err.details === 'string' ? err.details : '';
    const code = typeof err.code === 'string' ? err.code : '';

    return Boolean(
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('fetch failed') ||
      details.includes('Failed to fetch') ||
      code === 'PGRST202' ||
      code === 'ECONNABORTED'
    );
  }
  return false;
}
