import { useErrorLogStore } from '../stores/useErrorLogStore';

export function useErrorLogActions() {
  const { logs, clearLogs, filterLogs } = useErrorLogStore();

  return {
    logs,
    clearLogs,
    filterLogs,
  };
}
