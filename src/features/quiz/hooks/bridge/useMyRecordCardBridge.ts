import { useEffect, useState } from 'react';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';

interface UseMyRecordCardBridgeProps {
  world: string;
  category: string;
}

export function useMyRecordCardBridge({ world, category }: UseMyRecordCardBridgeProps) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<{
    'time-attack': number | null;
    survival: number | null;
  }>({ 'time-attack': null, survival: null });

  const getBestRecords = useLevelProgressStore((state) => state.getBestRecords);

  useEffect(() => {
    setLoading(true);
    // Simulate async loading (matches original implementation)
    const timer = setTimeout(() => {
      const bestRecords = getBestRecords(world, category);
      setRecords({
        'time-attack': bestRecords['time-attack'],
        survival: bestRecords['survival'],
      });
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [world, category, getBestRecords]);

  return {
    loading,
    records,
  };
}
