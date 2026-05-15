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
    useShallow((state) => state.getBestRecords(world, category))
  );

  useEffect(() => {
    // 컴포넌트 마운트 시 데이터 로딩 상태 시뮬레이션
    // 실제로는 스토어 초기화 확인 등이 필요할 수 있으나, 현재는 마운트 후 해제
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return {
    loading,
    records: {
      'time-attack': bestRecords['time-attack'],
      survival: bestRecords['survival'],
    },
  };
}
