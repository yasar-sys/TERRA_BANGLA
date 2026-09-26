import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import {
  districts,
  getSeries,
  hasData,
  VARIABLE_LABEL_KEY,
  type VariableKey,
} from "@/lib/climate";
import { normalize, rampColor } from "@/lib/colors";
import { fmt, useLang } from "@/lib/i18n";

const BD_CENTER = { lat: 23.75, lng: 90.35 };
const FLY_MS = 1200;

interface Feature {
  type: "Feature";
  properties: { districtId: string; name: string };
  geometry: unknown;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface GlobeExplorerProps {
  variable: VariableKey;
  phase: "world" | "bangladesh";
  onPhaseChange: (phase: "world" | "bangladesh") => void;
  onSelectDistrict: (districtId: string) => void;
  hexMode?: boolean;
  gridPoints?: { lat: number; lng: number; value: number }[];
}

export default function GlobeExplorer({
  variable,
  phase,
  onPhaseChange,
  onSelectDistrict,
  hexMode = false,
  gridPoints = [],
}: GlobeExplorerProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useLang();
  const [size, setSize] = useState({ w: 320, h: 420 });
  const [features, setFeatures] = useState<Feature[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/data/bangladesh-districts.geojson.json").then((mod) => {
      if (!cancelled) {
        setFeatures((mod.default as { features: Feature[] }).features);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Latest cached value per district for the active variable — real data only.
  const values = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of districts) {
      const series = getSeries(d.id, variable);
      const last = series[series.length - 1];
      if (last) map.set(d.id, last.value);
    }
    return map;
  }, [variable]);

  const bounds = useMemo(() => {
    const vals = [...values.values()];
    return vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals) }
      : { min: 0, max: 1 };
  }, [values]);

  const flyTo = useCallback((lat: number, lng: number, altitude: number) => {
    const ms = prefersReducedMotion() ? 0 : FLY_MS;
    globeRef.current?.pointOfView({ lat, lng, altitude }, ms);
    return ms;
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls() as
      | { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean }
      | undefined;
    if (!controls) return;
    controls.autoRotate = phase === "world" && !prefersReducedMotion();
    controls.autoRotateSpeed = 0.35;
  }, [phase, size]);

  useEffect(() => {
    if (phase === "world") flyTo(20, 60, 2.4);
    else flyTo(BD_CENTER.lat, BD_CENTER.lng, 0.42);
  }, [phase, flyTo]);

  const enterBangladesh = useCallback(() => {
    const ms = flyTo(BD_CENTER.lat, BD_CENTER.lng, 0.42);
    window.setTimeout(() => onPhaseChange("bangladesh"), ms);
  }, [flyTo, onPhaseChange]);

  const polygonColor = useCallback(
    (feat: object) => {
      const f = feat as Feature;
      const id = f.properties.districtId;
      if (!hasData(id)) return "rgba(45, 52, 72, 0.55)";
      const v = values.get(id);
      if (v === undefined) return "rgba(45, 52, 72, 0.55)";
      const base = rampColor(variable, normalize(v, bounds.min, bounds.max), 0.86);
      return hovered === id ? "rgba(124, 111, 240, 0.95)" : base;
    },
    [values, bounds, variable, hovered],
  );

  const hexBounds = useMemo(() => {
    const vals = gridPoints.map((p) => p.value);
    return vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals) }
      : { min: 0, max: 1 };
  }, [gridPoints]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <Globe
        ref={globeRef as React.MutableRefObject<GlobeMethods | undefined>}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/textures/earth-blue-marble.jpg"
        bumpImageUrl="/textures/earth-topology.png"
        atmosphereColor="#7C6FF0"
        atmosphereAltitude={0.18}
        showGraticules={phase === "world"}
        polygonsData={phase === "bangladesh" && !hexMode ? features : []}
        polygonGeoJsonGeometry={(f: object) => (f as Feature).geometry as never}
        polygonCapColor={polygonColor}
        polygonSideColor={() => "rgba(26, 31, 46, 0.7)"}
        polygonStrokeColor={() => "#0B0E1A"}
        polygonAltitude={(f: object) =>
          hovered === (f as Feature).properties.districtId ? 0.035 : 0.012
        }
        polygonLabel={(f: object) => {
          const id = (f as Feature).properties.districtId;
          const d = districts.find((x) => x.id === id);
          const v = values.get(id);
          const name = lang === "bn" && d ? d.bn : (d?.name ?? id);
          return `<div style="font-family:Inter,sans-serif;background:#1A1F2E;border:1px solid #2D3448;border-radius:8px;padding:6px 9px;color:#E8E6E1;font-size:12px">
            <strong>${name}</strong><br/>
            ${
              v === undefined
                ? t("district.nodata")
                : `${t(VARIABLE_LABEL_KEY[variable])}: ${fmt(v, lang, 2)}`
            }
          </div>`;
        }}
        onPolygonHover={(f: object | null) =>
          setHovered(f ? (f as Feature).properties.districtId : null)
        }
        onPolygonClick={(f: object) => onSelectDistrict((f as Feature).properties.districtId)}
        hexBinPointsData={hexMode ? gridPoints : []}
        hexBinPointLat={(p: object) => (p as { lat: number }).lat}
        hexBinPointLng={(p: object) => (p as { lng: number }).lng}
        hexBinPointWeight={(p: object) => (p as { value: number }).value}
        hexBinResolution={4}
        hexMargin={0.12}
        hexTopColor={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return rampColor(variable, normalize(mean, hexBounds.min, hexBounds.max), 0.95);
        }}
        hexSideColor={() => "rgba(26, 31, 46, 0.85)"}
        hexAltitude={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return 0.01 + 0.09 * normalize(mean, hexBounds.min, hexBounds.max);
        }}
        labelsData={
          phase === "world"
            ? [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng, text: "Bangladesh" }]
            : []
        }
        labelLat={(d: object) => (d as { lat: number }).lat}
        labelLng={(d: object) => (d as { lng: number }).lng}
        labelText={(d: object) => (d as { text: string }).text}
        labelSize={1.6}
        labelDotRadius={0.7}
        labelColor={() => "#F2A93B"}
        labelResolution={2}
        onLabelClick={enterBangladesh}
        ringsData={
          phase === "world" ? [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng }] : []
        }
        ringLat={(d: object) => (d as { lat: number }).lat}
        ringLng={(d: object) => (d as { lng: number }).lng}
        ringColor={() => () => "rgba(242, 169, 59, 0.75)"}
        ringMaxRadius={6}
        ringPropagationSpeed={1.4}
        ringRepeatPeriod={prefersReducedMotion() ? 0 : 900}
      />

      {phase === "world" ? (
        <button
          type="button"
          onClick={enterBangladesh}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-panel transition-transform hover:scale-[1.03]"
        >
          {t("hero.enter")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onPhaseChange("world")}
          className="absolute left-3 top-3 rounded-md border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
        >
          ← {t("globe.back")}
        </button>
      )}
    </div>
  );
}
