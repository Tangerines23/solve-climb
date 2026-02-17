import { useDebugShortcuts } from '@/hooks/useDebugShortcuts';

/**
 * DebugShortcutsWrapper
 *
 * This component wraps the useDebugShortcuts hook so it can be lazy-loaded.
 * This prevents debug logic and stores from being included in the main production bundle.
 */
export default function DebugShortcutsWrapper() {
  useDebugShortcuts();
  return null;
}
