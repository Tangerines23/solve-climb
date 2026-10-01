import { describe, it, expect } from 'vitest';
import { getInventoryQuantity, addOrIncrementItem, isSimulationError } from '../shopUtils';
import type { InventoryItem } from '@/types/user';

describe('getInventoryQuantity', () => {
  it('returns 0 when inventory is null', () => {
    expect(getInventoryQuantity(null, 'itemCode')).toBe(0);
  });

  it('returns 0 when inventory is undefined', () => {
    expect(getInventoryQuantity(undefined, 'itemCode')).toBe(0);
  });

  it('returns 0 when inventory is not an array', () => {
    expect(getInventoryQuantity({} as any, 'itemCode')).toBe(0);
  });

  it('returns 0 when code is null', () => {
    expect(getInventoryQuantity([], null)).toBe(0);
  });

  it('returns 0 when code is undefined', () => {
    expect(getInventoryQuantity([], undefined)).toBe(0);
  });

  it('returns 0 when code is an empty string', () => {
    expect(getInventoryQuantity([], '')).toBe(0);
  });

  it('returns quantity for an existing item', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    expect(getInventoryQuantity(inventory, 'itemCode')).toBe(5);
  });

  it('returns 0 for a non-existing item', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    expect(getInventoryQuantity(inventory, 'nonExistingCode')).toBe(0);
  });

  it('clamps negative quantity to 0', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: -5 },
    ];
    expect(getInventoryQuantity(inventory, 'itemCode')).toBe(0);
  });

  it('returns 0 if item quantity is undefined or not a number', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: undefined as any },
    ];
    expect(getInventoryQuantity(inventory, 'itemCode')).toBe(0);
  });
});

describe('addOrIncrementItem', () => {
  it('returns empty array if inventory is null and targetItem is invalid', () => {
    expect(addOrIncrementItem(null, null, 1)).toEqual([]);
  });

  it('returns safe copy of inventory if targetItem is null', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    expect(addOrIncrementItem(inventory, null, 1)).toEqual(inventory);
  });

  it('returns safe copy of inventory if targetItem is undefined', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    expect(addOrIncrementItem(inventory, undefined, 1)).toEqual(inventory);
  });

  it('returns safe copy of inventory if targetItem has empty code', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    expect(addOrIncrementItem(inventory, { code: '', name: 'Empty' }, 1)).toEqual(inventory);
  });

  it('increments existing item quantity by 1 by default', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    const newInventory = addOrIncrementItem(inventory, { code: 'itemCode', name: 'Item' }, 1);
    expect(newInventory).toEqual([
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 6 },
    ]);
  });

  it('increments existing item quantity by custom incrementAmount', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    const newInventory = addOrIncrementItem(inventory, { code: 'itemCode', name: 'Item' }, 1, 3);
    expect(newInventory).toEqual([
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 8 },
    ]);
  });

  it('clamps negative incrementAmount to 0', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    const newInventory = addOrIncrementItem(inventory, { code: 'itemCode', name: 'Item' }, 1, -3);
    expect(newInventory).toEqual([
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ]);
  });

  it("appends new item with id, code, name, description fallback ('') and quantity", () => {
    const inventory: InventoryItem[] = [];
    const newInventory = addOrIncrementItem(
      inventory,
      { code: 'newItemCode', name: 'NewItem' },
      99
    );
    expect(newInventory).toEqual([
      { id: 99, code: 'newItemCode', name: 'NewItem', description: '', quantity: 1 },
    ]);
  });

  it('ensures immutability (does not mutate original array)', () => {
    const inventory: InventoryItem[] = [
      { id: 1, code: 'itemCode', name: 'Item', description: '', quantity: 5 },
    ];
    const newInventory = addOrIncrementItem(inventory, { code: 'itemCode', name: 'Item' }, 1);
    expect(inventory).not.toBe(newInventory);
  });
});

describe('isSimulationError', () => {
  it("returns true for string containing 'Failed to fetch'", () => {
    expect(isSimulationError('Failed to fetch')).toBe(true);
  });

  it("returns true for string containing 'PGRST202'", () => {
    expect(isSimulationError('PGRST202')).toBe(true);
  });

  it("returns true for string containing 'NetworkError'", () => {
    expect(isSimulationError('NetworkError')).toBe(true);
  });

  it("returns true for string containing 'fetch failed'", () => {
    expect(isSimulationError('fetch failed')).toBe(true);
  });

  it("returns true for error object with message 'Failed to fetch'", () => {
    expect(isSimulationError(new Error('Failed to fetch'))).toBe(true);
  });

  it("returns true for error object with message 'NetworkError'", () => {
    expect(isSimulationError(new Error('NetworkError'))).toBe(true);
  });

  it("returns true for error object with details containing 'Failed to fetch'", () => {
    expect(isSimulationError({ details: 'Failed to fetch' } as any)).toBe(true);
  });

  it("returns true for error object with code 'PGRST202'", () => {
    expect(isSimulationError({ code: 'PGRST202' } as any)).toBe(true);
  });

  it("returns true for error object with code 'ECONNABORTED'", () => {
    expect(isSimulationError({ code: 'ECONNABORTED' } as any)).toBe(true);
  });

  it("returns false for generic Error('Something else')", () => {
    expect(isSimulationError(new Error('Something else'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSimulationError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isSimulationError(undefined)).toBe(false);
  });

  it('returns false for numbers', () => {
    expect(isSimulationError(123)).toBe(false);
  });

  it('returns false for empty objects', () => {
    expect(isSimulationError({})).toBe(false);
  });
});
