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
import { Button } from "@/components/ui/button";
import { Vector3 } from "three";

const BD_CENTER = { lat: 23.75, lng: 90.35 };
const FLY_MS = 1600;
const EMPTY: object[] = [];
const WORLD_LABELS = [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng, text: "Bangladesh" }];
const WORLD_RINGS = [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng }];
const sideColor = () => "rgba(17, 18, 28, 0.72)";
const strokeColor = () => "rgba(10, 10, 15, 0.92)";
const ringColorFn = () => (t: number) => `rgba(157, 78, 255, ${Math.max(0, 0.9 - t)})`;

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
       return hovered === id ? "rgba(157, 78, 255, 0.97)" : base;
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

  const [view, setView] = useState<"side" | "tilt" | "top">("tilt");
  const [spin, setSpin] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const districtLabels = useMemo(
    () => districts.map((d) => ({ lat: d.lat, lng: d.lon, text: lang === "bn" ? d.bn : d.name })),
    [lang],
  );

  // Aim at Bangladesh instead of the globe's centre so low camera angles keep the data in frame.
  useEffect(() => {
    if (!hexMode) return;
    const g = globeRef.current;
    if (!g) return;
    const viewSettings = {
      top: { outward: 52, tangent: 0 },
      tilt: { outward: 52, tangent: 18 },
      side: { outward: 52, tangent: 32 },
    } as const;
    const targetCoords = g.getCoords(BD_CENTER.lat, BD_CENTER.lng, 0.035);
    const southCoords = g.getCoords(BD_CENTER.lat - 2, BD_CENTER.lng, 0.035);
    const target = new Vector3(targetCoords.x, targetCoords.y, targetCoords.z);
    const outward = target.clone().normalize();
    const south = new Vector3(southCoords.x, southCoords.y, southCoords.z);
    const tangent = south.sub(target).normalize();
    const setting = viewSettings[view];
    const destination = target
      .clone()
      .addScaledVector(outward, setting.outward)
      .addScaledVector(tangent, setting.tangent);
    const camera = g.camera();
    const controls = g.controls() as {
      target: Vector3;
      autoRotate: boolean;
      autoRotateSpeed: number;
      minDistance: number;
      maxDistance: number;
      update: () => void;
    };
    camera.position.copy(destination);
    camera.lookAt(target);
    controls.target.copy(target);
    controls.minDistance = 30;
    controls.maxDistance = 180;
    controls.autoRotate = spin && !prefersReducedMotion();
    controls.autoRotateSpeed = 0.7;
    controls.update();
    return () => {
      controls.autoRotate = false;
    };
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
        atmosphereColor="#2EE6D6"
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
          if (phase === "world") return `<div class="globe-tooltip globe-tooltip-active"><strong>${lang === "bn" ? "বাংলাদেশ — ক্লিক করুন" : "Bangladesh — click to enter"}</strong></div>`;
          const id = (f as Feature).properties.districtId;
          const d = districts.find((x) => x.id === id);
          const v = values.get(id);
          const name = lang === "bn" && d ? d.bn : (d?.name ?? id);
          return `<div class="globe-tooltip">
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
          return 0.012 + 0.075 * normalize(mean, hexBounds.min, hexBounds.max);
        }}
        hexLabel={(bin: object) => {
          const b = bin as { sumWeight: number; points: { lat: number; lng: number }[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          const p = b.points[0];
          const d = p ? nearestDistrict(p.lat, p.lng) : undefined;
          const name = d ? (lang === "bn" ? d.bn : d.name) : "";
          return `<div class="globe-tooltip"><strong>${lang === "bn" ? "কাছের এলাকা" : "Near"}: ${name}</strong><br/>${p ? `${p.lat.toFixed(2)}°N ${p.lng.toFixed(2)}°E<br/>` : ""}${fmt(mean, lang, 2)}</div>`;
        }}
        labelsData={phase === "world" ? WORLD_LABELS : hexMode && showNames ? districtLabels : EMPTY}
        labelLat={(d: object) => (d as { lat: number }).lat}
        labelLng={(d: object) => (d as { lng: number }).lng}
        labelText={(d: object) => (d as { text: string }).text}
        labelSize={phase === "world" ? 1.6 : 0.09}
        labelDotRadius={phase === "world" ? 0.7 : 0.03}
        labelAltitude={phase === "world" ? 0.002 : 0.095}
        labelColor={() => (phase === "world" ? "#B17AFF" : "rgba(238,246,248,0.95)")}
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
            ["side", lang === "bn" ? "পাশ থেকে" : "Side view"],
            ["tilt", lang === "bn" ? "৩D কোণ" : "3D tilt"],
            ["top", lang === "bn" ? "উপর থেকে" : "Top view"],
          ] as const).map(([k, label]) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={view === k ? "default" : "outline"}
              aria-pressed={view === k}
              onClick={() => setView(k)}
              className="bg-card/90"
            >
              {label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={spin ? "default" : "outline"}
            aria-pressed={spin}
            onClick={() => setSpin((s) => !s)}
            className="bg-card/90"
          >
            {lang === "bn" ? "৩৬০° ঘোরান" : "Spin 360°"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={showNames}
            onClick={() => setShowNames((s) => !s)}
            className="bg-card/90"
          >
            {showNames ? (lang === "bn" ? "নাম লুকান" : "Hide names") : lang === "bn" ? "নাম দেখান" : "Show names"}
          </Button>
          <p className="max-w-[9rem] rounded-md bg-card/80 px-2 py-1 text-[10px] text-muted-foreground">
            {lang === "bn" ? "টেনে ঘোরান, স্ক্রল করে জুম" : "Drag to orbit, scroll to zoom"}
          </p>
        </div>
      )}

      {phase === "world" ? (
        <Button
          type="button"
          onClick={enterBangladesh}
          className="cta-pulse absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5"
        >
          {t("hero.enter")}
        </Button>
      ) : hexMode ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPhaseChange("world")}
          className="absolute left-3 top-3 bg-card/90"
        >
          ← {t("globe.back")}
        </Button>
      )}
    </div>
  );
}
