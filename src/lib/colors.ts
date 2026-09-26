import type { VariableKey } from "@/lib/climate";

const RAMPS: Record<VariableKey, [string, string]> = {
  ndvi: ["#2D3448", "#3EC98A"],
  lst: ["#2D3448", "#F2A93B"],
  temperature: ["#2D3448", "#F2A93B"],
  solar: ["#2D3448", "#F2E23B"],
  precipitation: ["#2D3448", "#7C6FF0"],
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ] as const;
}

/** Linear ramp between the variable's two stops. t is clamped to [0,1]. */
export function rampColor(variable: VariableKey, t: number, alpha = 1) {
  const [from, to] = RAMPS[variable];
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const k = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  const mix = a.map((c, i) => Math.round(c + (b[i]! - c) * k));
  return `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${alpha})`;
}

export function normalize(value: number, min: number, max: number) {
  if (!Number.isFinite(value) || max === min) return 0;
  return (value - min) / (max - min);
}

export const TREND_COLOR = {
  rising: "var(--color-rising)",
  declining: "var(--color-declining)",
  flat: "var(--color-muted-foreground)",
} as const;
