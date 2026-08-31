// src/utils/polyfills.ts
/**
 * Polyfill Array.prototype.at and String.prototype.at for older WebViews / browsers (Chrome < 92)
 */
if (typeof Array.prototype.at !== 'function') {
  Object.defineProperty(Array.prototype, 'at', {
    value: function <T>(this: T[], index: number): T | undefined {
      const k = index < 0 ? this.length + index : index;
      // eslint-disable-next-line security/detect-object-injection
      return k >= 0 && k < this.length ? this[k] : undefined;
    },
    writable: true,
    configurable: true,
  });
}

if (typeof String.prototype.at !== 'function') {
  Object.defineProperty(String.prototype, 'at', {
    value: function (this: string, index: number): string | undefined {
      const k = index < 0 ? this.length + index : index;
      return k >= 0 && k < this.length ? this.charAt(k) : undefined;
    },
    writable: true,
    configurable: true,
  });
}
