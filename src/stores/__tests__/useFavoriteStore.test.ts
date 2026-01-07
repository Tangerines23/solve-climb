import { describe, it, expect, beforeEach } from 'vitest';
import { useFavoriteStore } from '../useFavoriteStore';

describe('useFavoriteStore', () => {
  beforeEach(() => {
    // Clear all favorites before each test
    const { favorites } = useFavoriteStore.getState();
    favorites.forEach((fav) => {
      useFavoriteStore.getState().removeFavorite(fav.id);
    });
  });

  it('should initialize with empty favorites', () => {
    const { favorites } = useFavoriteStore.getState();
    expect(favorites).toEqual([]);
  });

  it('should add favorite', () => {
    const { addFavorite } = useFavoriteStore.getState();
    addFavorite({
      id: 'test-1',
      type: 'category',
      categoryId: 'math',
      name: '수학',
    });

    const { favorites } = useFavoriteStore.getState();
    expect(favorites).toHaveLength(1);
    expect(favorites[0].categoryId).toBe('math');
  });

  it('should toggle favorite (remove if exists)', () => {
    const { addFavorite } = useFavoriteStore.getState();
    addFavorite({
      id: 'test-1',
      type: 'category',
      categoryId: 'math',
      name: '수학',
    });

    // Add again to toggle (remove)
    addFavorite({
      id: 'test-1',
      type: 'category',
      categoryId: 'math',
      name: '수학',
    });

    const { favorites } = useFavoriteStore.getState();
    expect(favorites).toHaveLength(0);
  });

  it('should remove favorite by id', () => {
    const { addFavorite, removeFavorite } = useFavoriteStore.getState();
    addFavorite({
      id: 'test-1',
      type: 'category',
      categoryId: 'math',
      name: '수학',
    });

    const { favorites } = useFavoriteStore.getState();
    removeFavorite(favorites[0].id);

    const { favorites: updatedFavorites } = useFavoriteStore.getState();
    expect(updatedFavorites).toHaveLength(0);
  });

  it('should check if favorite exists', () => {
    const { addFavorite, isFavorite } = useFavoriteStore.getState();
    addFavorite({
      id: 'test-1',
      type: 'category',
      categoryId: 'math',
      name: '수학',
    });

    expect(isFavorite('math')).toBe(true);
    expect(isFavorite('language')).toBe(false);
  });

  it('should get favorite id', () => {
    const { addFavorite, getFavoriteId } = useFavoriteStore.getState();
    addFavorite({
      id: 'test-1',
      type: 'category',
      categoryId: 'math',
      name: '수학',
    });

    const id = getFavoriteId('math');
    expect(id).toBeTruthy();
    expect(id).toBe('test-1');
  });

  it('should handle subcategory favorites', () => {
    const { addFavorite, isFavorite, getFavoriteId } = useFavoriteStore.getState();
    addFavorite({
      id: 'test-1',
      type: 'subcategory',
      categoryId: 'math',
      subCategoryId: 'arithmetic',
      name: '사칙연산',
    });

    expect(isFavorite('math', 'arithmetic')).toBe(true);
    expect(isFavorite('math')).toBe(false);
    
    const id = getFavoriteId('math', 'arithmetic');
    expect(id).toBe('test-1');
  });
});

