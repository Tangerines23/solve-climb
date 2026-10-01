import type { InventoryItem } from '@/types/user';

export function getInventoryQuantity(
  inventory: Array<{ code: string; quantity: number }>,
  code: string
): number {
  const item = inventory.find((i) => i.code === code);
  return item ? item.quantity : 0;
}

export function addOrIncrementItem(
  inventory: InventoryItem[],
  targetItem: { code: string; name: string; description?: string },
  itemId: number
): InventoryItem[] {
  const itemIndex = inventory.findIndex((i) => i.code === targetItem.code);
  if (itemIndex !== -1) {
    return inventory.map((i, index) =>
      index === itemIndex ? { ...i, quantity: i.quantity + 1 } : i
    );
  }
  return [
    ...inventory,
    {
      id: itemId,
      code: targetItem.code,
      name: targetItem.name,
      description: targetItem.description ?? '',
      quantity: 1,
    },
  ];
}

export function isSimulationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string; code?: string };
  return Boolean(err.message?.includes('Failed to fetch') || err.code === 'PGRST202');
}
