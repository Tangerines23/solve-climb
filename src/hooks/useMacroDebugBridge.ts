import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { builtInMacros, executeMacro, type MacroExecutionResult } from '../utils/debugMacros';

export function useMacroDebugBridge() {
  const navigate = useNavigate();
  const { debugSetStamina, debugSetMinerals } = useUserStore();

  const [isRunning, setIsRunning] = useState(false);
  const [currentMacroId, setCurrentMacroId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ step: 0, total: 0 });
  const [lastResult, setLastResult] = useState<MacroExecutionResult | null>(null);

  const handleRunMacro = useCallback(async (macroId: string) => {
    const macro = builtInMacros.find((m) => m.id === macroId);
    if (!macro || isRunning) return;

    setIsRunning(true);
    setCurrentMacroId(macroId);
    setProgress({ step: 0, total: macro.steps.length });
    setLastResult(null);

    // 타입 래퍼: store 함수가 비동기 RPC를 호출하므로 그대로 사용
    const wrappedSetStamina = async (v: number) => {
      await debugSetStamina(v);
    };
    const wrappedSetMinerals = async (v: number) => {
      await debugSetMinerals(v);
    };

    const result = await executeMacro(
      macro,
      navigate,
      wrappedSetStamina,
      wrappedSetMinerals,
      (step, total) => setProgress({ step, total })
    );

    setLastResult(result);
    setIsRunning(false);
    setCurrentMacroId(null);
  }, [isRunning, debugSetStamina, debugSetMinerals, navigate]);

  return {
    macros: builtInMacros,
    isRunning,
    currentMacroId,
    progress,
    lastResult,
    handleRunMacro,
  };
}
