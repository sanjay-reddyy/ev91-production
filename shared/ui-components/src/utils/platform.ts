// Platform detection utilities
// Use global this to safely detect platform without direct window/document references
export const isWeb = (() => {
  try {
    return typeof globalThis !== 'undefined' && 
           typeof (globalThis as any).window !== 'undefined' && 
           typeof (globalThis as any).document !== 'undefined';
  } catch {
    return false;
  }
})();

export const isNative = !isWeb;

// Platform-specific style helpers
export const createStyles = <T>(webStyles: T, nativeStyles: T): T => {
  return isWeb ? webStyles : nativeStyles;
};
