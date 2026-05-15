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

/** 즐겨찾기 추가 시 전달하는 값 (id 미입력 시 스토어에서 생성) */
export type AddFavoriteInput = Omit<Favorite, 'timestamp' | 'id'> & { id?: string };

interface FavoriteState {
  favorites: Favorite[];
  addFavorite: (favorite: AddFavoriteInput) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (categoryId: string, subCategoryId?: string) => boolean;
  getFavoriteId: (categoryId: string, subCategoryId?: string) => string | null;
}

function generateFavoriteId(categoryId: string, subCategoryId?: string): string {
  return `fav-${categoryId}-${subCategoryId ?? 'cat'}-${Date.now()}`;
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
          // 즐겨찾기 추가 (id 미입력 시 자동 생성)
          const { id: _, ...rest } = favorite;
          const id = favorite.id ?? generateFavoriteId(favorite.categoryId, favorite.subCategoryId);
          set((state) => ({
            favorites: [{ ...rest, id, timestamp: Date.now() }, ...state.favorites],
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
