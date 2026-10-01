import { describe, it, expect } from 'vitest';
import { getInventoryQuantity, addOrIncrementItem, isSimulationError } from '../shopUtils';

describe('getInventoryQuantity', () => {
  it('returns the quantity of an existing item', () => {
    const inventory = [
      { code: 'item1', quantity: 5 },
      { code: 'item2', quantity: 10 },
    ];
    expect(getInventoryQuantity(inventory, 'item1')).toBe(5);
  });

  it('returns 0 for a non-existing item', () => {
    const inventory = [
      { code: 'item1', quantity: 5 },
      { code: 'item2', quantity: 10 },
    ];
    expect(getInventoryQuantity(inventory, 'item3')).toBe(0);
  });
});

describe('addOrIncrementItem', () => {
  it('increments the quantity of an existing item', () => {
    const inventory = [
      { code: 'item1', quantity: 5, id: 1 },
      { code: 'item2', quantity: 10, id: 2 },
    ];
    const targetItem = { code: 'item1', name: 'Item 1' };
    const result = addOrIncrementItem(inventory, targetItem, 1);
    expect(result).toEqual([
      { code: 'item1', quantity: 6, id: 1 },
      { code: 'item2', quantity: 10, id: 2 },
    ]);
  });

  it('appends a new item with quantity 1 when it does not exist', () => {
    const inventory = [
      { code: 'item1', quantity: 5, id: 1 },
      { code: 'item2', quantity: 10, id: 2 },
    ];
    const targetItem = { code: 'item3', name: 'Item 3' };
    const result = addOrIncrementItem(inventory, targetItem, 3);
    expect(result).toEqual([
      { code: 'item1', quantity: 5, id: 1 },
      { code: 'item2', quantity: 10, id: 2 },
      { code: 'item3', name: 'Item 3', description: '', quantity: 1, id: 3 },
    ]);
  });
});

describe('isSimulationError', () => {
  it('returns true for an error with "Failed to fetch" message', () => {
    const error = new Error('Failed to fetch');
    expect(isSimulationError(error)).toBe(true);
  });

  it('returns true for an error with code "PGRST202"', () => {
    const error = { code: 'PGRST202', message: 'Some other message' };
    expect(isSimulationError(error)).toBe(true);
  });

  it('returns false for a standard error', () => {
    const error = new Error('Standard error');
    expect(isSimulationError(error)).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isSimulationError(null)).toBe(false);
    expect(isSimulationError(undefined)).toBe(false);
  });
});
