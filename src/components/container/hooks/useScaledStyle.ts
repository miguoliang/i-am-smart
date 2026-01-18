import { useMemo } from "react";
import type { CSSProperties } from "react";

/**
 * Hook to compute scaled style with transform
 * 
 * Merges transform with existing transform (e.g. from drag).
 * Applies scale last to ensure translation happens in unscaled coordinates.
 * Only adds scale transform if it's not 1 to avoid hydration mismatch.
 * 
 * @param scale - Scale factor to apply (default: 1)
 * @param style - Base style object (may contain existing transform)
 * @returns Computed style with scale transform applied
 */
export function useScaledStyle(
  scale: number = 1,
  style?: CSSProperties
): CSSProperties {
  return useMemo(() => {
    const baseStyle: CSSProperties = { ...style };

    // Merge transform with existing transform (e.g. from drag)
    // Apply scale last to ensure translation happens in unscaled coordinates
    // Only add scale transform if it's not 1 (to avoid hydration mismatch)
    if (scale !== 1) {
      const existingTransform = baseStyle.transform ? `${baseStyle.transform} ` : "";
      baseStyle.transform = `${existingTransform}scale(${scale})`;
      baseStyle.transformOrigin = "top left";
    }

    return baseStyle;
  }, [scale, style]);
}
