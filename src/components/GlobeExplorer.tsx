import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import {
  districts,
  getSeries,
  hasData,
  nearestDistrict,
  VARIABLE_LABEL_KEY,
  type VariableKey,
} from "@/lib/climate";
import { normalize, rampColor, spectralColor } from "@/lib/colors";
import { fmt, useLang } from "@/lib/i18n";

const BD_CENTER = { lat: 23.75, lng: 90.35 };
const FLY_MS = 1600;
const EMPTY: object[] = [];
const WORLD_LABELS = [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng, text: "Bangladesh" }];
const WORLD_RINGS = [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng }];
const sideColor = () => "rgba(26, 31, 46, 0.7)";
const strokeColor = () => "#0B0E1A";
const ringColorFn = () => () => "rgba(242, 169, 59, 0.75)";

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
    const update = () => {
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
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
    if (hexMode) return;
    const controls = globeRef.current?.controls() as
      | { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean }
      | undefined;
    if (!controls) return;
    controls.autoRotate = phase === "world" && !prefersReducedMotion();
    controls.autoRotateSpeed = 0.35;
  }, [phase, size, hexMode]);

  useEffect(() => {
    if (hexMode) return;
    if (phase === "world") flyTo(20, 60, 2.4);
    else flyTo(BD_CENTER.lat, BD_CENTER.lng, 0.24);
  }, [phase, flyTo, hexMode]);

  const enterBangladesh = useCallback(() => {
    const ms = flyTo(BD_CENTER.lat, BD_CENTER.lng, 0.24);
    window.setTimeout(() => onPhaseChange("bangladesh"), ms);
  }, [flyTo, onPhaseChange]);

  const polygonColor = useCallback(
    (feat: object) => {
      const f = feat as Feature;
      const id = f.properties.districtId;
      if (phase === "world") return "rgba(242, 169, 59, 0.9)";
      if (!hasData(id)) return "rgba(45, 52, 72, 0.55)";
      const v = values.get(id);
      if (v === undefined) return "rgba(45, 52, 72, 0.55)";
      const base = rampColor(variable, normalize(v, bounds.min, bounds.max), 0.86);
      return hovered === id ? "rgba(124, 111, 240, 0.95)" : base;
    },
    [values, bounds, variable, hovered, phase],
  );

  const polygonAltitude = useCallback(
    (f: object) =>
      phase === "world" ? 0.02 : hovered === (f as Feature).properties.districtId ? 0.035 : 0.012,
    [phase, hovered],
  );

  const hexBounds = useMemo(() => {
    const vals = gridPoints.map((p) => p.value);
    return vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals) }
      : { min: 0, max: 1 };
  }, [gridPoints]);

  const [view, setView] = useState<"tilt" | "top">("tilt");
  const [spin, setSpin] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const districtLabels = useMemo(
    () => districts.map((d) => ({ lat: d.lat, lng: d.lon, text: lang === "bn" ? d.bn : d.name })),
    [lang],
  );

  // Heatmap: orbit the camera around Bangladesh itself (not Earth's centre) for a true 360° view.
  useEffect(() => {
    if (!hexMode) return;
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as {
      target: { set: (x: number, y: number, z: number) => void };
      minDistance: number;
      maxDistance: number;
      autoRotate: boolean;
      autoRotateSpeed: number;
      maxPolarAngle: number;
      update: () => void;
    };
    const cam = g.camera();
    const t = g.getCoords(BD_CENTER.lat, BD_CENTER.lng, 0);
    const c =
      view === "top"
        ? g.getCoords(BD_CENTER.lat, BD_CENTER.lng, 0.2)
        : g.getCoords(BD_CENTER.lat - 5.5, BD_CENTER.lng, 0.1);
    controls.target.set(t.x, t.y, t.z);
    cam.position.set(c.x, c.y, c.z);
    controls.minDistance = 3;
    controls.maxDistance = 60;
    controls.autoRotate = spin && !prefersReducedMotion();
    controls.autoRotateSpeed = 1.2;
    controls.update();
  }, [hexMode, view, spin, size]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <Globe
        ref={globeRef as React.MutableRefObject<GlobeMethods | undefined>}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/textures/earth-blue-marble.jpg"
        bumpImageUrl="/textures/earth-topology.png"
        atmosphereColor="#66c8c1"
        atmosphereAltitude={0.18}
        showGraticules={phase === "world"}
        showAtmosphere
        polygonsData={!hexMode ? features : EMPTY}
        polygonGeoJsonGeometry={(f: object) => (f as Feature).geometry as never}
        polygonCapColor={polygonColor}
        polygonSideColor={sideColor}
        polygonStrokeColor={strokeColor}
        polygonAltitude={polygonAltitude}
        polygonCapCurvatureResolution={10}
        polygonsTransitionDuration={0}
        polygonLabel={(f: object) => {
          if (phase === "world") return `<div style="font-family:Inter,sans-serif;background:#1A1F2E;border:1px solid #2D3448;border-radius:8px;padding:6px 9px;color:#F2A93B;font-size:12px"><strong>${lang === "bn" ? "বাংলাদেশ — ক্লিক করুন" : "Bangladesh — click to enter"}</strong></div>`;
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
          phase === "world" ? undefined : setHovered(f ? (f as Feature).properties.districtId : null)
        }
        onPolygonClick={(f: object) => (phase === "world" ? enterBangladesh() : onSelectDistrict((f as Feature).properties.districtId))}
        onGlobeClick={({ lat, lng }: { lat: number; lng: number }) => {
          if (phase === "world" && lat > 20 && lat < 27 && lng > 88 && lng < 93) enterBangladesh();
        }}
        hexBinPointsData={hexMode ? gridPoints : EMPTY}
        hexBinPointLat={(p: object) => (p as { lat: number }).lat}
        hexBinPointLng={(p: object) => (p as { lng: number }).lng}
        hexBinPointWeight={(p: object) => (p as { value: number }).value}
        hexBinResolution={4}
        hexMargin={0.12}
        hexTopColor={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return spectralColor(variable, normalize(mean, hexBounds.min, hexBounds.max), 0.95);
        }}
        hexSideColor={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return spectralColor(variable, normalize(mean, hexBounds.min, hexBounds.max), 0.55);
        }}
        hexAltitude={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return 0.004 + 0.03 * normalize(mean, hexBounds.min, hexBounds.max);
        }}
        hexLabel={(bin: object) => {
          const b = bin as { sumWeight: number; points: { lat: number; lng: number }[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          const p = b.points[0];
          const d = p ? nearestDistrict(p.lat, p.lng) : undefined;
          const name = d ? (lang === "bn" ? d.bn : d.name) : "";
          return `<div style="font-family:Inter,sans-serif;background:#1A1F2E;border:1px solid #2D3448;border-radius:8px;padding:6px 9px;color:#E8E6E1;font-size:12px"><strong>${lang === "bn" ? "কাছের এলাকা" : "Near"}: ${name}</strong><br/>${p ? `${p.lat.toFixed(2)}°N ${p.lng.toFixed(2)}°E<br/>` : ""}${fmt(mean, lang, 2)}</div>`;
        }}
        labelsData={phase === "world" ? WORLD_LABELS : hexMode && showNames ? districtLabels : EMPTY}
        labelLat={(d: object) => (d as { lat: number }).lat}
        labelLng={(d: object) => (d as { lng: number }).lng}
        labelText={(d: object) => (d as { text: string }).text}
        labelSize={phase === "world" ? 1.6 : 0.11}
        labelDotRadius={phase === "world" ? 0.7 : 0.03}
        labelAltitude={phase === "world" ? 0.002 : 0.036}
        labelColor={() => (phase === "world" ? "#F2A93B" : "rgba(232,230,225,0.95)")}
        labelResolution={2}
        onLabelClick={() => { if (phase === "world") enterBangladesh(); }}
        ringsData={phase === "world" ? WORLD_RINGS : EMPTY}
        ringLat={(d: object) => (d as { lat: number }).lat}
        ringLng={(d: object) => (d as { lng: number }).lng}
        ringColor={ringColorFn}
        ringMaxRadius={6}
        ringPropagationSpeed={1.4}
        ringRepeatPeriod={prefersReducedMotion() ? 0 : 900}
      />

      {hexMode && (
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {([
            ["tilt", lang === "bn" ? "৩D কোণ" : "3D tilt"],
            ["top", lang === "bn" ? "উপর থেকে" : "Top view"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={view === k}
              onClick={() => setView(k)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${view === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/90 text-foreground hover:bg-secondary"}`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={spin}
            onClick={() => setSpin((s) => !s)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${spin ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/90 text-foreground hover:bg-secondary"}`}
          >
            {lang === "bn" ? "৩৬০° ঘোরান" : "Spin 360°"}
          </button>
          <button
            type="button"
            aria-pressed={showNames}
            onClick={() => setShowNames((s) => !s)}
            className="rounded-md border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            {showNames ? (lang === "bn" ? "নাম লুকান" : "Hide names") : lang === "bn" ? "নাম দেখান" : "Show names"}
          </button>
          <p className="max-w-[9rem] rounded-md bg-card/80 px-2 py-1 text-[10px] text-muted-foreground">
            {lang === "bn" ? "টেনে ঘোরান, স্ক্রল করে জুম" : "Drag to orbit, scroll to zoom"}
          </p>
        </div>
      )}

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
