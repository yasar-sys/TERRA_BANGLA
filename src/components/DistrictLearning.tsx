import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, Check, Heart, Leaf, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { analyzeVariable, availableVariables, districts, getDistrict, type VariableKey } from "@/lib/climate";
import { useLang } from "@/lib/i18n";
import { getFavoriteDistrictIds, saveLearningAttempt, toggleFavoriteDistrict } from "@/lib/learning.functions";
import districtGeo from "@/data/bangladesh-districts.geojson.json";

type Trend = "up" | "down" | "same";
type Step = "intro" | "lesson" | "outro";
type GeoFeature = { properties: { districtId: string; name: string }; geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] } };
const LABELS: Record<VariableKey, { en: string; bn: string; icon: string }> = {
  ndvi: { en: "Vegetation", bn: "উদ্ভিদ", icon: "🌿" }, lst: { en: "Land temperature", bn: "ভূপৃষ্ঠের তাপমাত্রা", icon: "🌡️" },
  temperature: { en: "Air temperature", bn: "বায়ুর তাপমাত্রা", icon: "☀️" }, solar: { en: "Sunlight", bn: "সূর্যালোক", icon: "🔆" }, precipitation: { en: "Rainfall", bn: "বৃষ্টিপাত", icon: "🌧️" },
};
const TRENDS: Record<Trend, { en: string; bn: string; icon: string }> = { up: { en: "Increased", bn: "বেড়েছে", icon: "↗" }, down: { en: "Decreased", bn: "কমেছে", icon: "↘" }, same: { en: "No clear change", bn: "স্পষ্ট পরিবর্তন নেই", icon: "→" } };

function pathFor(feature: GeoFeature) {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates as number[][][]] : feature.geometry.coordinates as number[][][][];
  return polygons.flatMap((p) => p).map((ring) => ring.map(([lng, lat], i) => `${i ? "L" : "M"}${(((Number(lng) - 88) / 5) * 240).toFixed(1)},${(((26.7 - Number(lat)) / 6.3) * 300).toFixed(1)}`).join(" ") + " Z").join(" ");
}

function DistrictMap({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return <svg viewBox="0 0 240 300" className="learn-map" role="img" aria-label="Bangladesh district map">{(districtGeo.features as GeoFeature[]).map((f) => <path key={f.properties.districtId} d={pathFor(f)} className={f.properties.districtId === activeId ? "learn-map-active" : "learn-map-district"} onClick={() => onSelect(f.properties.districtId)}><title>{f.properties.name}</title></path>)}</svg>;
}

function Guides({ celebrate = false }: { celebrate?: boolean }) {
  return <div className={`learn-guides ${celebrate ? "is-celebrating" : ""}`} aria-hidden="true"><span className="learn-guide">🧑🏽‍🎓</span><span className="learn-orbit"><Leaf /></span><span className="learn-guide">👩🏽‍🔬</span></div>;
}

function sceneClass(variable: VariableKey) { return variable === "ndvi" ? "is-green" : variable === "precipitation" ? "is-rain" : variable === "solar" ? "is-solar" : "is-warm"; }

export function DistrictLearning() {
  const { lang } = useLang();
  const L = (en: string, bn: string) => lang === "bn" ? bn : en;
  const [step, setStep] = useState<Step>("intro");
  const [districtId, setDistrictId] = useState("dhaka");
  const vars = availableVariables(districtId);
  const [variable, setVariable] = useState<VariableKey>("lst");
  const [picked, setPicked] = useState<Trend | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const saveAttempt = useServerFn(saveLearningAttempt);
  const toggleFavorite = useServerFn(toggleFavoriteDistrict);
  const listFavorites = useServerFn(getFavoriteDistrictIds);
  const activeVariable = vars.includes(variable) ? variable : vars[0] ?? "temperature";
  const analysis = useMemo(() => analyzeVariable(districtId, activeVariable), [districtId, activeVariable]);
  const district = getDistrict(districtId);
  const correct: Trend = !analysis?.result.trend.significant_at_0_05 ? "same" : (analysis.result.slope.slope_per_decade ?? 0) > 0 ? "up" : "down";
  const chooseDistrict = (id: string) => { setDistrictId(id); setPicked(null); setSaveMessage(""); const next = availableVariables(id); if (next.length && !next.includes(variable)) setVariable(next[0]); };
  const openLesson = async () => { setStep("lesson"); const { data } = await supabase.auth.getUser(); if (data.user) { try { setFavorite((await listFavorites()).includes(districtId)); } catch { setFavorite(false); } } };
  const answer = async (choice: Trend) => {
    setPicked(choice);
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaveMessage(L("Sign in to save this result.", "ফলাফল সেভ করতে সাইন ইন করো।")); return; }
    try { await saveAttempt({ data: { districtId, variable: activeVariable, selectedTrend: choice } }); setSaveMessage(L("Result saved to your profile.", "ফলাফল তোমার প্রোফাইলে সেভ হয়েছে।")); } catch { setSaveMessage(L("Result could not be saved.", "ফলাফল সেভ করা যায়নি।")); }
  };
  const updateFavorite = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaveMessage(L("Sign in to save favorite districts.", "প্রিয় জেলা সেভ করতে সাইন ইন করো।")); return; }
    const next = !favorite; await toggleFavorite({ data: { districtId, favorite: next } }); setFavorite(next); setSaveMessage(next ? L("District saved.", "জেলা সেভ হয়েছে।") : L("District removed.", "জেলা সরানো হয়েছে।"));
  };

  if (step === "intro") return <section className="learn-shell learn-intro"><div className="learn-grid"/><div className="learn-intro-copy"><p className="learn-eyebrow"><Sparkles/> {L("Animated climate lesson", "অ্যানিমেটেড জলবায়ু পাঠ")}</p><h2>{L("Bangladesh in My Hands", "আমার হাতে বাংলাদেশ")}</h2><p>{L("Choose any district. Compare an earlier NASA record with a recent one, then answer one simple question.", "যেকোনো জেলা বেছে নাও। NASA-এর আগের ও সাম্প্রতিক রেকর্ড তুলনা করে একটি সহজ প্রশ্নের উত্তর দাও।")}</p><Button size="lg" onClick={() => void openLesson()}>{L("Start learning", "শেখা শুরু করো")} <ArrowRight/></Button></div><Guides/></section>;
  if (step === "outro") return <section className="learn-shell learn-outro"><Sparkles className="learn-outro-spark"/><Guides celebrate/><p className="learn-eyebrow">{L("Lesson complete", "পাঠ শেষ")}</p><h2>{L("You read a real climate trend", "তুমি একটি বাস্তব জলবায়ু প্রবণতা বুঝেছ")}</h2><p>{L("Try another district to see how Bangladesh changes from place to place.", "বাংলাদেশের একেক স্থানের পরিবর্তন দেখতে আরেকটি জেলা বেছে নাও।")}</p><div className="flex flex-wrap justify-center gap-2"><Button onClick={() => { setPicked(null); setStep("lesson"); }}>{L("Explore another district", "আরেকটি জেলা দেখো")}</Button><Button asChild variant="outline"><Link to="/profile">{L("View profile", "প্রোফাইল দেখো")}</Link></Button></div></section>;
  return <section className="learn-shell"><header className="learn-header"><div><p className="learn-eyebrow"><BookOpen/> {L("District learning studio", "জেলা শেখার স্টুডিও")}</p><h2>{L("Bangladesh in My Hands", "আমার হাতে বাংলাদেশ")}</h2></div><Guides/></header><div className="learn-layout"><aside className="learn-picker"><label>{L("Choose a district", "জেলা বেছে নাও")}<select value={districtId} onChange={(e) => chooseDistrict(e.target.value)}>{districts.map((d) => <option key={d.id} value={d.id}>{lang === "bn" ? d.bn : d.name}</option>)}</select></label><DistrictMap activeId={districtId} onSelect={chooseDistrict}/><p><MapPin/> {lang === "bn" ? district?.bn : district?.name} · {district?.division}</p></aside><div className="learn-content"><div className="learn-toolbar"><div className="learn-tabs">{vars.map((key) => <Button key={key} size="sm" variant={activeVariable === key ? "default" : "outline"} onClick={() => { setVariable(key); setPicked(null); }}>{LABELS[key].icon} {LABELS[key][lang]}</Button>)}</div><Button size="icon" variant="outline" onClick={updateFavorite} aria-label={L("Save favorite district", "প্রিয় জেলা সেভ করো")}><Heart className={favorite ? "fill-current" : ""}/></Button></div>{analysis ? <><div className={`learn-comparison ${sceneClass(activeVariable)}`}><article><span>{L("Earlier", "আগে")}</span><strong>{analysis.result.period.start}</strong><div className="learn-weather" aria-hidden>{LABELS[activeVariable].icon}</div><b>{analysis.result.first_value?.toFixed(activeVariable === "ndvi" ? 2 : 1)} {analysis.unit}</b></article><div className="learn-time"><i/><ArrowRight/></div><article><span>{L("Recent", "সাম্প্রতিক")}</span><strong>{analysis.result.period.end}</strong><div className="learn-weather is-current" aria-hidden>{LABELS[activeVariable].icon}</div><b>{analysis.result.current_value?.toFixed(activeVariable === "ndvi" ? 2 : 1)} {analysis.unit}</b></article></div><p className="learn-source">NASA · {analysis.provenance.dataset_id} · {L("cached annual record", "সংরক্ষিত বার্ষিক রেকর্ড")}</p><div className="learn-question"><h3>{L(`What happened to ${LABELS[activeVariable].en.toLowerCase()}?`, `${LABELS[activeVariable].bn}-এর কী পরিবর্তন হয়েছে?`)}</h3><div className="learn-answers">{(Object.keys(TRENDS) as Trend[]).map((trend) => <Button key={trend} variant="outline" disabled={picked !== null} onClick={() => void answer(trend)} className={picked ? trend === correct ? "is-correct" : trend === picked ? "is-wrong" : "" : ""}><span>{TRENDS[trend].icon}</span>{TRENDS[trend][lang]}{picked && trend === correct ? <Check/> : null}</Button>)}</div>{picked ? <div className="learn-feedback" role="status"><p>{picked === correct ? L("Correct — well observed!", "সঠিক—খুব ভালো পর্যবেক্ষণ!") : L("Good try. The highlighted answer matches the measured trend.", "ভালো চেষ্টা। চিহ্নিত উত্তরটি পরিমাপ করা প্রবণতার সঙ্গে মেলে।")}</p><small>{L("Per decade", "প্রতি দশকে")}: {analysis.result.slope.slope_per_decade > 0 ? "+" : ""}{analysis.result.slope.slope_per_decade.toFixed(2)} {analysis.unit} · p={analysis.result.trend.p_value.toFixed(3)}</small>{saveMessage ? <p className="learn-save-note">{saveMessage}</p> : null}<Button onClick={() => setStep("outro")}>{L("Finish this lesson", "এই পাঠ শেষ করো")} <ArrowRight/></Button></div> : null}</div></> : <div className="learn-empty">{L("Data not yet available for this district.", "এই জেলার তথ্য এখনো পাওয়া যায়নি।")}</div>}</div></div><p className="learn-honesty">ⓘ {L("Every number comes from cached NASA records. Illustrations are explanatory, not measured images.", "প্রতিটি সংখ্যা সংরক্ষিত NASA রেকর্ড থেকে এসেছে। ছবিগুলো ব্যাখ্যার জন্য, পরিমাপ করা ছবি নয়।")}</p></section>;
}