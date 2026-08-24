export const safeGet = <T>(
  arr: Record<number, T> | T[] | undefined,
  index: number,
  fallback: T
): T => {
  if (!arr) return fallback;
  if (Array.isArray(arr)) {
    return arr[index] !== undefined ? arr[index] : fallback;
  }
  return arr[index] !== undefined ? arr[index] : fallback;
};
