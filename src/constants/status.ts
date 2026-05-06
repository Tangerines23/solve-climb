/**
 * Global status constants to replace magic strings.
 * Used for toast notifications, RPC responses, and internal state tracking.
 */
export const STATUS = {
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
  IDLE: 'idle',
  LOADING: 'loading',
} as const;

export type StatusType = (typeof STATUS)[keyof typeof STATUS] | (string & {});
