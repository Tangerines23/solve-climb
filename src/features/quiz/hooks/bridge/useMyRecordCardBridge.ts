import { useLevelProgressStore } from '../../stores/useLevelProgressStore';

interface UseMyRecordCardBridgeProps {
  world: string;
  category: string;
}

export function useMyRecordCardBridge({ world, category }: UseMyRecordCardBridgeProps) {
  // 해당 월드/카테고리의 최고 기록을 실시간으로 구독
  const bestRecords = useLevelProgressStore((state) => state.getBestRecords(world, category));

  // 로딩 상태는 데이터가 계산되면 즉시 해제 (또는 필요시 유지)
  const loading = false;

  return {
    loading,
    records: {
      'time-attack': bestRecords['time-attack'],
      survival: bestRecords['survival'],
    },
  };
}
