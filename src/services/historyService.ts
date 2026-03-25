import { Category } from '@/types/quiz';
import { storageService, STORAGE_KEYS } from './index';

const MAX_HISTORY_ITEMS = 100;

export interface LocalHistoryRecord {
  id: string;
  world: string;
  category: Category;
  level: number;
  mode: string;
  score: number;
  correctCount: number;
  total: number;
  date: string;
}

export const historyService = {
  /**
   * Saves a new record to local history.
   */
  saveRecord(record: Omit<LocalHistoryRecord, 'id' | 'date'>) {
    try {
      const history = storageService.get<LocalHistoryRecord[]>(STORAGE_KEYS.LOCAL_HISTORY) || [];

      const newRecord: LocalHistoryRecord = {
        ...record,
        id: `local-${Date.now()}`,
        date: new Date().toISOString(),
      };

      // Sort by newest and limit size
      const updatedHistory = [newRecord, ...history].slice(0, MAX_HISTORY_ITEMS);
      storageService.set(STORAGE_KEYS.LOCAL_HISTORY, updatedHistory);

      return newRecord;
    } catch (e) {
      console.warn('[historyService] Failed to save local history:', e);
      return null;
    }
  },

  /**
   * Gets all local history records.
   */
  getHistory(): LocalHistoryRecord[] {
    try {
      return storageService.get<LocalHistoryRecord[]>(STORAGE_KEYS.LOCAL_HISTORY) || [];
    } catch (e) {
      console.warn('[historyService] Failed to get local history:', e);
      return [];
    }
  },

  /**
   * Clears all local history.
   */
  clearHistory() {
    storageService.remove(STORAGE_KEYS.LOCAL_HISTORY);
  },
};
