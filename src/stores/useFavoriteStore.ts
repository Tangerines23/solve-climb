// src/stores/useFavoriteStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FavoriteType = 'category' | 'subcategory';

export interface Favorite {
  id: string;
  type: FavoriteType;
  categoryId: string;
  subCategoryId?: string;
  name: string;
  timestamp: number;
}

interface FavoriteState {
  favorites: Favorite[];
  addFavorite: (favorite: Omit<Favorite, 'timestamp'>) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (categoryId: string, subCategoryId?: string) => boolean;
  getFavoriteId: (categoryId: string, subCategoryId?: string) => string | null;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (favorite) => {
        const existingId = get().getFavoriteId(favorite.categoryId, favorite.subCategoryId);
        if (existingId) {
          // 이미 즐겨찾기에 있으면 제거 (토글)
          get().removeFavorite(existingId);
        } else {
          // 즐겨찾기 추가
          set((state) => ({
            favorites: [{ ...favorite, timestamp: Date.now() }, ...state.favorites],
          }));
        }
      },
      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },
      isFavorite: (categoryId, subCategoryId) => {
        const id = get().getFavoriteId(categoryId, subCategoryId);
        return id !== null;
      },
      getFavoriteId: (categoryId, subCategoryId) => {
        const favorite = get().favorites.find(
          (f) =>
            f.categoryId === categoryId &&
            (subCategoryId ? f.subCategoryId === subCategoryId : !f.subCategoryId)
        );
        return favorite?.id || null;
      },
    }),
    {
      name: 'favorites-storage',
    }
  )
);
