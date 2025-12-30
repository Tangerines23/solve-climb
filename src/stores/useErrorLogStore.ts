import { create } from 'zustand';

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: string;
}

interface ErrorLogState {
  logs: ErrorLogEntry[];
  addLog: (level: 'error' | 'warning' | 'info', message: string, stack?: string, context?: string) => void;
  clearLogs: () => void;
  filterLogs: (level?: 'error' | 'warning' | 'info', startTime?: Date, endTime?: Date) => ErrorLogEntry[];
}

export const useErrorLogStore = create<ErrorLogState>((set, get) => ({
  logs: [],

  addLog: (level, message, stack, context) => {
    const entry: ErrorLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      stack,
      context,
    };

    set((state) => ({
      logs: [entry, ...state.logs].slice(0, 1000), // 최대 1000개 유지
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  filterLogs: (level, startTime, endTime) => {
    const { logs } = get();
    return logs.filter((log) => {
      if (level && log.level !== level) return false;
      if (startTime && log.timestamp < startTime) return false;
      if (endTime && log.timestamp > endTime) return false;
      return true;
    });
  },
}));

