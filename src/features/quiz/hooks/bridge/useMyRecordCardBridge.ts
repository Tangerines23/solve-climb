import { useShallow } from 'zustand/react/shallow';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { useState, useEffect } from 'react';

interface UseMyRecordCardBridgeProps {
  world: string;
  category: string;
}

export function useMyRecordCardBridge({ world, category }: UseMyRecordCardBridgeProps) {
  const [loading, setLoading] = useState(true);

  // 해당 월드/카테고리의 최고 기록을 실시간으로 구독
  const bestRecords = useLevelProgressStore(
    useShallow((state) => {
      // Defensive check for store method existence
      if (typeof state.getBestRecords !== 'function') {
        return null;
      }
      return state.getBestRecords(world, category);
    })
  );

  useEffect(() => {
    // 컴포넌트 마운트 시 데이터 로딩 상태 시뮬레이션
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const recordsFallback = {
    'time-attack': null,
    survival: null,
  };

  return {
    loading: loading || !bestRecords,
    records: bestRecords || recordsFallback,
  };
}
