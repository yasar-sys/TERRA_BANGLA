import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getDistrictTheme, type DistrictTheme } from "@/lib/district-themes";

function AmbientPattern({ theme }: { theme: DistrictTheme }) {
  const { ambientAnimationType: type, ambientAnimationParams: params } = theme;
  const items = Array.from({ length: params.density }, (_, index) => index);
  return (
    <div className={`district-ambient district-ambient-${type}`} aria-hidden="true">
      {items.map((index) => <i key={index} style={{ "--ambient-index": index } as CSSProperties} />)}
    </div>
  );
}

function ThemeLayer({ districtId, ambient = false, leaving = false }: { districtId: string; ambient?: boolean; leaving?: boolean }) {
  const theme = getDistrictTheme(districtId);
  const style = {
    "--district-color-a": theme.gradientColors[0],
    "--district-color-b": theme.gradientColors[1],
    "--district-color-c": theme.gradientColors[2],
    "--district-ambient-speed": `${theme.ambientAnimationParams.speed}s`,
    "--district-ambient-opacity": theme.ambientAnimationParams.opacity,
    "--district-ambient-angle": `${theme.ambientAnimationParams.angle}deg`,
  } as CSSProperties;
  return <div className={`district-theme-layer ${leaving ? "is-leaving" : "is-entering"}`} style={style} aria-hidden="true">{ambient ? <AmbientPattern theme={theme} /> : null}</div>;
}

export function DistrictThemeBackdrop({ districtId, children }: { districtId: string; children: ReactNode }) {
  const lastDistrict = useRef(districtId);
  const [previousDistrict, setPreviousDistrict] = useState<string | null>(null);
  useEffect(() => {
    if (lastDistrict.current === districtId) return;
    setPreviousDistrict(lastDistrict.current);
    lastDistrict.current = districtId;
    const timer = window.setTimeout(() => setPreviousDistrict(null), 520);
    return () => window.clearTimeout(timer);
  }, [districtId]);
  return (
    <div className="kids-theme-shell">
      {previousDistrict ? <ThemeLayer districtId={previousDistrict} leaving /> : null}
      <ThemeLayer key={districtId} districtId={districtId} ambient />
      <div className="kids-theme-content">{children}</div>
    </div>
  );
}
