export function getInventoryQuantity(
  inventory: Array<{ code: string; quantity: number }>,
  code: string
): number {
  const item = inventory.find((i) => i.code === code);
  return item ? item.quantity : 0;
}

export function addOrIncrementItem(
  inventory: any[],
  targetItem: { code: string; name: string; description?: string },
  itemId: number
): any[] {
  const itemIndex = inventory.findIndex((i) => i.code === targetItem.code);
  if (itemIndex !== -1) {
    return inventory.map((i, index) =>
      index === itemIndex ? { ...i, quantity: i.quantity + 1 } : i
    );
  }
  return [...inventory, { ...targetItem, quantity: 1, id: itemId }];
}

export function isSimulationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { message?: string; code?: string };
  return Boolean(err.message?.includes('Failed to fetch') || err.code === 'PGRST202');
}
