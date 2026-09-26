import { useMemo, useState } from "react";
import { ArrowLeft, Check, LockKeyhole, RotateCcw, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

type Bi = { en: string; bn: string };
type MissionId = "padma" | "sundarbans" | "village" | "dhaka";
type Trend = "up" | "down" | "same";
type Screen = "map" | MissionId | "final" | "award";

interface Mission {
  id: MissionId;
  number: number;
  icon: string;
  name: Bi;
  place: Bi;
  prompt: Bi;
  correct: Trend;
  clue: Bi;
  success: Bi;
}

const MISSIONS: Mission[] = [
  {
    id: "padma",
    number: 1,
    icon: "🌊",
    name: { en: "Padma River Mystery", bn: "পদ্মা নদীর রহস্য" },
    place: { en: "Padma River", bn: "পদ্মা নদী" },
    prompt: { en: "Look at the blue water. What changed?", bn: "নীল পানির দিকে দেখো। কী বদলেছে?" },
    correct: "down",
    clue: { en: "Water level: decreased", bn: "পানির স্তর: কমেছে" },
    success: { en: "Great! You found a trend!", bn: "দারুণ! তুমি একটি প্রবণতা খুঁজে পেয়েছ!" },
  },
  {
    id: "sundarbans",
    number: 2,
    icon: "🌳",
    name: { en: "Sundarbans Detective", bn: "সুন্দরবন গোয়েন্দা" },
    place: { en: "Sundarbans", bn: "সুন্দরবন" },
    prompt: { en: "Which picture changed? Tap it!", bn: "কোন ছবিটি বদলেছে? সেটিতে চাপ দাও!" },
    correct: "down",
    clue: { en: "Mangrove trees: decreased", bn: "ম্যানগ্রোভ গাছ: কমেছে" },
    success: { en: "Excellent! You found another clue!", bn: "চমৎকার! তুমি আরেকটি সূত্র পেয়েছ!" },
  },
  {
    id: "village",
    number: 3,
    icon: "🌾",
    name: { en: "Village Weather Detective", bn: "গ্রামের আবহাওয়া গোয়েন্দা" },
    place: { en: "Bangladesh Village", bn: "বাংলাদেশের গ্রাম" },
    prompt: { en: "What rain trend do you see?", bn: "বৃষ্টির কী প্রবণতা দেখতে পাচ্ছ?" },
    correct: "down",
    clue: { en: "Rain symbols: decreased", bn: "বৃষ্টির চিহ্ন: কমেছে" },
    success: { en: "Sharp eyes! The rain symbols became fewer.", bn: "তীক্ষ্ণ নজর! বৃষ্টির চিহ্ন কমে গেছে।" },
  },
  {
    id: "dhaka",
    number: 4,
    icon: "🏙️",
    name: { en: "Dhaka City Mystery", bn: "ঢাকা শহরের রহস্য" },
    place: { en: "Dhaka City", bn: "ঢাকা শহর" },
    prompt: { en: "What increased? Tap the changed object!", bn: "কী বেড়েছে? বদলে যাওয়া বস্তুতে চাপ দাও!" },
    correct: "up",
    clue: { en: "Buildings: increased", bn: "ভবন: বেড়েছে" },
    success: { en: "Mystery solved! You spotted more buildings.", bn: "রহস্য সমাধান! তুমি বেশি ভবন খুঁজে পেয়েছ।" },
  },
];

const TREND_LABELS: Record<Trend, { icon: string; label: Bi }> = {
  up: { icon: "⬆️", label: { en: "Increased", bn: "বেড়েছে" } },
  down: { icon: "⬇️", label: { en: "Decreased", bn: "কমেছে" } },
  same: { icon: "➡️", label: { en: "Almost the same", bn: "প্রায় একই" } },
};

function Detective({ celebrate = false }: { celebrate?: boolean }) {
  return (
    <svg viewBox="0 0 150 170" className={celebrate ? "td-detective td-jump" : "td-detective td-float"} aria-hidden="true">
      <ellipse className="td-shadow" cx="75" cy="161" rx="38" ry="7" />
      <path className="td-coat" d="M40 156q4-48 35-52 31 4 35 52z" />
      <circle className="td-skin" cx="75" cy="70" r="34" />
      <path className="td-hair" d="M44 65q3-35 31-35t33 35q-14-16-30-14-18 1-34 14z" />
      <path className="td-hat" d="M35 42h80q-9-13-21-14l-5-19H57l-4 19q-12 2-18 14z" />
      <path className="td-hat-band" d="M54 27h42l-3-9H57z" />
      <circle className="td-ink" cx="63" cy="70" r="3" /><circle className="td-ink" cx="87" cy="70" r="3" />
      <path className="td-line" d="M66 84q9 8 18 0" />
      <path className="td-shirt" d="M60 110l15 17 15-17 12 46H48z" />
      <g transform="translate(99 101) rotate(-22)"><circle className="td-glass" cx="0" cy="0" r="20" /><path className="td-glass-line" d="M15 15l24 24" /></g>
    </svg>
  );
}

function WeatherFriends() {
  return <div className="td-weather-friends" aria-hidden="true">
    <div className="td-weather-sun"><span>•‿•</span></div>
    <div className="td-weather-cloud"><span>•ᴗ•</span><i/><i/><i/></div>
  </div>;
}

function SceneDecor({ kind, now, interactive, onObject }: { kind: MissionId; now: boolean; interactive?: boolean | undefined; onObject?: ((correct: boolean) => void) | undefined }) {
  if (kind === "padma") {
    const top = now ? 142 : 112;
    return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label={now ? "Now: lower illustrated river water" : "Before: higher illustrated river water"}>
      <rect className="td-sky" width="360" height="220" /><g className="td-sun-friend"><circle className="td-sun" cx="305" cy="38" r="22"/><circle className="td-ink" cx="297" cy="36" r="2"/><circle className="td-ink" cx="313" cy="36" r="2"/><path className="td-line" d="M299 45q6 5 12 0"/></g>
      <path className="td-bank" d={`M0 ${top - 20}q95-23 180 0t180 0v100H0z`} />
      <path className="td-water td-wave" d={`M0 ${top}q70-18 140 0t140 0 80 0v80H0z`} />
      <g transform="translate(62 96)"><path className="td-tree" d="M0 40V5" /><circle className="td-leaf" cy="-2" r="22" /></g>
      <g transform={`translate(${now ? 226 : 202} ${top - 10})`} className="td-boat"><path className="td-boat-hull" d="M-35 0h70l-10 15h-48z" /><path className="td-line" d="M0 0v-35" /><path className="td-sail" d="M2-34v27h27z" /></g>
      <g transform={`translate(150 ${top + 28})`} className="td-fish"><path className="td-fish-body" d="M-15 0q15-14 30 0-15 14-30 0m-1 0-13-10v20z" /><circle className="td-ink" cx="8" cy="-2" r="1.5" /></g>
    </svg>;
  }
  if (kind === "sundarbans") {
    const trees = now ? [68, 154] : [52, 112, 175, 238];
    return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label={now ? "Now: fewer illustrated mangrove trees" : "Before: more illustrated mangrove trees"}>
      <rect className="td-sky" width="360" height="220" /><g className="td-cloud-drift"><path className="td-cloud-shape" d="M250 54c0-13 11-23 24-21 5-15 27-16 34-2 17-3 29 8 29 22z"/><circle className="td-ink" cx="283" cy="45" r="2"/><circle className="td-ink" cx="297" cy="45" r="2"/><path className="td-line" d="M285 51q5 4 10 0"/></g><path className="td-water" d="M0 157q90-15 180 0t180 0v63H0z" />
      {trees.map((x) => <g key={x} transform={`translate(${x} 135)`} onClick={() => interactive && onObject?.(true)} className={interactive ? "td-clickable" : ""}><path className="td-trunk" d="M0 35V0m0 14-14 24m14-18 14 18" /><circle className="td-leaf" cy="-9" r="24" /></g>)}
      <g transform="translate(276 160)" onClick={() => interactive && onObject?.(false)} className={interactive ? "td-clickable" : ""}><path className="td-boat-hull" d="M-29 0h58l-8 12h-42z" /><path className="td-line" d="M0 0v-29" /><path className="td-sail" d="M2-28v22h22z" /></g>
      <g transform="translate(217 187)"><path className="td-fish-body" d="M-11 0q11-9 22 0-11 9-22 0m-1 0-9-7v14z" /></g>
      <g transform="translate(309 131)"><ellipse className="td-deer" rx="17" ry="10"/><circle className="td-deer" cx="18" cy="-10" r="8"/><path className="td-line" d="M-10 8v16m20-16v16m13-24 5-11m-5 11-2-12" /></g>
    </svg>;
  }
  if (kind === "village") {
    return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label="Illustrated Bangladesh village with rice field, farmer, pond and rain">
      <rect className="td-sky" width="360" height="220" /><g className="td-cloud td-cloud-drift" transform="translate(75 44)"><circle cx="0" cy="0" r="20"/><circle cx="25" cy="-8" r="27"/><circle cx="52" cy="2" r="20"/><rect x="0" y="0" width="55" height="20"/><circle className="td-ink" cx="18" cy="3" r="2"/><circle className="td-ink" cx="34" cy="3" r="2"/><path className="td-line" d="M20 10q6 4 12 0"/></g>
      {[74,102,130].map((x) => <path key={x} className="td-rain" d={`M${x} 70v18`} />)}
      <path className="td-field" d="M0 125q90-16 180 0t180 0v95H0z" /><ellipse className="td-water" cx="278" cy="170" rx="62" ry="26" />
      <g transform="translate(52 112)"><rect className="td-house" x="0" y="20" width="70" height="55"/><path className="td-roof" d="M-8 23 35-8l43 31z"/><rect className="td-door" x="27" y="47" width="17" height="28"/></g>
      <g transform="translate(175 137)"><circle className="td-skin" cy="-17" r="9"/><path className="td-hat" d="M-14-22h28l-7-7H-7z"/><path className="td-shirt" d="M0-8v34m0-4-16 24m16-24 16 24m-1-37 15 18M-15 9-28 24" /></g>
      {Array.from({ length: 7 }).map((_, i) => <path key={i} className="td-rice" d={`M${18 + i * 30} 178v30m0-18-9-9m9 16 9-9`} />)}
    </svg>;
  }
  const buildings = now ? [34, 82, 128, 182, 231] : [62, 142, 224];
  return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label={now ? "Now: more illustrated city buildings" : "Earlier: fewer illustrated city buildings"}>
    <rect className="td-sky" width="360" height="220" /><g className={now ? "td-sun-friend td-sun-hot" : "td-sun-friend"}><circle className="td-sun" cx="310" cy="35" r="21"/><circle className="td-ink" cx="303" cy="33" r="2"/><circle className="td-ink" cx="317" cy="33" r="2"/><path className="td-line" d={now ? "M303 44q7-5 14 0" : "M303 42q7 6 14 0"}/>{now && <path className="td-rain" d="M326 40q7 8 0 14q-7-6 0-14"/>}</g>
    {buildings.map((x, i) => <g key={x} onClick={() => interactive && onObject?.(true)} className={interactive ? "td-clickable" : ""}><rect className={i % 2 ? "td-building-alt" : "td-building"} x={x} y={80 - (i % 3) * 16} width="42" height={104 + (i % 3) * 16}/>{[0,1,2].map(r => [0,1].map(c => <rect key={`${r}-${c}`} className="td-window" x={x + 8 + c*18} y={94 + r*23 - (i % 3)*16} width="8" height="10"/>))}</g>)}
    <path className="td-road" d="M0 178h360v42H0z"/><path className="td-road-line" d="M0 199h360"/>
    <g transform="translate(87 186)" onClick={() => interactive && onObject?.(false)} className={interactive ? "td-clickable td-car" : "td-car"}><rect className="td-car-body" x="-25" y="0" width="50" height="20" rx="6"/><path className="td-car-body" d="M-14 0-5-12h21l12 12"/><circle className="td-wheel" cx="-14" cy="20" r="6"/><circle className="td-wheel" cx="16" cy="20" r="6"/></g>
    <g transform="translate(287 151)"><path className="td-trunk" d="M0 32V0"/><circle className="td-leaf" cy="-7" r="20"/></g>
  </svg>;
}

function SceneCard({ label, kind, now, interactive, onObject }: { label: string; kind: MissionId; now: boolean; interactive?: boolean; onObject?: (correct: boolean) => void }) {
  return <div className="overflow-hidden rounded-2xl border-4 border-game-ink bg-game-paper shadow-game">
    <div className="bg-game-ink px-3 py-2 text-center text-sm font-black uppercase text-game-paper">{label}</div>
    <div className="aspect-[16/10]"><SceneDecor kind={kind} now={now} interactive={interactive} onObject={onObject} /></div>
  </div>;
}

function TrendChoices({ lang, onChoose }: { lang: "en" | "bn"; onChoose: (trend: Trend) => void }) {
  return <div className="grid grid-cols-3 gap-2 sm:gap-3">
    {(Object.keys(TREND_LABELS) as Trend[]).map((trend) => <Button key={trend} type="button" variant="outline" onClick={() => onChoose(trend)} className="h-auto min-h-20 flex-col whitespace-normal border-2 border-game-ink bg-game-paper px-2 py-3 text-center text-game-ink shadow-game hover:-translate-y-1 hover:bg-game-yellow">
      <span className="text-2xl" aria-hidden="true">{TREND_LABELS[trend].icon}</span><span className="text-xs font-black sm:text-sm">{TREND_LABELS[trend].label[lang]}</span>
    </Button>)}
  </div>;
}

function MapScreen({ lang, completed, stars, onOpen, onFinal }: { lang: "en" | "bn"; completed: Set<MissionId>; stars: number; onOpen: (id: MissionId) => void; onFinal: () => void }) {
  return <div className="td-game-shell relative overflow-hidden rounded-[2rem] border-4 border-game-paper shadow-game">
    <div className="td-cloudscape" aria-hidden="true"><span/><span/><span/></div>
    <WeatherFriends />
    <div className="relative z-20 px-4 pt-6 text-center sm:px-8 sm:pt-8">
      <p className="td-kicker">{lang === "bn" ? "ছোট্ট গোয়েন্দার বাংলাদেশ অভিযান" : "A LITTLE DETECTIVE'S BANGLADESH ADVENTURE"}</p>
      <h2 className="td-game-title">{lang === "bn" ? "আমার হাতে বাংলাদেশ" : "Bangladesh in My Hands"}</h2>
      <p className="td-game-subtitle">{lang === "bn" ? "ছবি দেখো • পরিবর্তন খোঁজো • সূত্র জেতো" : "Look closely • Spot changes • Win clues"}</p>
    </div>
    <div className="td-adventure-map relative z-10 mx-auto mt-4 min-h-[650px] max-w-4xl sm:min-h-[620px]">
      <div className="td-hills" aria-hidden="true"><i/><i/><i/></div>
      <svg viewBox="0 0 760 560" className="td-route" aria-hidden="true"><path d="M180 92C420 112 512 173 520 241S212 291 211 374s237 63 353 123"/><path className="td-route-progress" pathLength="4" strokeDasharray={`${completed.size} 4`} d="M180 92C420 112 512 173 520 241S212 291 211 374s237 63 353 123"/></svg>
      {MISSIONS.map((mission, i) => {
        const positions = ["td-stop-one", "td-stop-two", "td-stop-three", "td-stop-four"];
        const done = completed.has(mission.id);
        const next = i === completed.size;
        return <Button key={mission.id} type="button" onClick={() => onOpen(mission.id)} className={`td-map-pin ${positions[i]} ${done ? "td-stop-done" : ""} ${next ? "td-stop-next" : ""}`}>
          <span className="td-pin-number">{done ? <Check/> : mission.number}</span><span className="td-pin-icon" aria-hidden="true">{mission.icon}</span><span className="td-pin-copy">{mission.place[lang]}</span>
        </Button>;
      })}
      <div className="td-river" aria-hidden="true"><span className="td-mini-boat">⛵</span></div>
      <div className="td-map-detective"><Detective /></div>
      <div className="td-map-flora td-flora-left" aria-hidden="true">♒</div><div className="td-map-flora td-flora-right" aria-hidden="true">♧</div>
    </div>
    <div className="td-game-hud relative z-20">
      <div className="td-progress"><div className="td-progress-top"><span><Star className="fill-current"/> {stars} {lang === "bn" ? "তারা" : "Stars"}</span><b>{completed.size}/4</b></div><div className="td-progress-track"><i style={{ width: `${completed.size * 25}%` }}/></div></div>
      <Button type="button" size="lg" disabled={completed.size < MISSIONS.length} onClick={onFinal} className="td-final-button">{completed.size < MISSIONS.length ? <><LockKeyhole/> {lang === "bn" ? "সব সূত্র খুঁজে নাও" : "Find every clue"}</> : <><Search/> {lang === "bn" ? "শেষ রহস্য সমাধান" : "Solve final mystery"}</>}</Button>
    </div>
    <p className="td-honesty">ⓘ {lang === "bn" ? "ছবিগুলো পর্যবেক্ষণ অনুশীলনের জন্য—বাস্তব ঐতিহাসিক তথ্য নয়।" : "Illustrations teach observation — they are not real historical data."}</p>
  </div>;
}

function MissionScreen({ mission, lang, completed, onBack, onComplete }: { mission: Mission; lang: "en" | "bn"; completed: boolean; onBack: () => void; onComplete: () => void }) {
  const [feedback, setFeedback] = useState<"idle" | "wrong" | "right">(completed ? "right" : "idle");
  const answer = (value: Trend | boolean) => {
    const right = typeof value === "boolean" ? value : value === mission.correct;
    setFeedback(right ? "right" : "wrong");
    if (right) onComplete();
  };
  const objectLevel = mission.id === "sundarbans" || mission.id === "dhaka";
  return <div className="td-paper td-mission-shell overflow-hidden rounded-[2rem] border-4 border-game-paper shadow-game">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-game-ink bg-game-yellow px-3 py-3 sm:px-5"><Button type="button" variant="ghost" onClick={onBack} className="text-game-ink hover:bg-game-paper"><ArrowLeft /> {lang === "bn" ? "মানচিত্র" : "Map"}</Button><p className="font-black text-game-ink">{mission.icon} {lang === "bn" ? `মিশন ${mission.number.toLocaleString("bn-BD")}` : `Mission ${mission.number}`}: {mission.name[lang]}</p><span className="rounded-full bg-game-paper px-3 py-1 text-xs font-bold text-game-ink">{lang === "bn" ? "ছবি দেখে শেখো" : "Picture practice"}</span></div>
    <div className="p-4 sm:p-6">
      <div className="mb-4 rounded-xl border-2 border-dashed border-game-water bg-game-paper/70 px-3 py-2 text-center text-xs font-semibold text-game-muted">ⓘ {lang === "bn" ? "এটি পর্যবেক্ষণ শেখার কাল্পনিক ছবি—বাস্তব ঐতিহাসিক তথ্য নয়।" : "Practice illustration for learning observation — not real historical data."}</div>
      {mission.id === "village" ? <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><SceneCard label={lang === "bn" ? "বাংলাদেশের গ্রাম" : "BANGLADESH VILLAGE"} kind="village" now /><div className="rounded-2xl border-4 border-game-ink bg-game-paper p-4 text-game-ink shadow-game"><p className="text-center font-black">{lang === "bn" ? "সহজ ছবির সময়রেখা" : "SIMPLE PICTURE TIMELINE"}</p><div className="mt-4 space-y-4 text-center text-xl font-black"><p>2010 → 🌧️ 🌧️ 🌧️</p><p>2020 → 🌧️ 🌧️</p><p>2030 → 🌧️</p></div></div></div> : <div className="grid gap-4 sm:grid-cols-2"><SceneCard label={mission.id === "dhaka" ? (lang === "bn" ? "আগে" : "EARLIER") : (lang === "bn" ? "আগে" : "BEFORE")} kind={mission.id} now={false}/><SceneCard label={lang === "bn" ? "এখন" : "NOW"} kind={mission.id} now interactive={objectLevel && feedback !== "right"} onObject={answer}/></div>}
      <div className="mx-auto mt-6 max-w-2xl text-center"><h3 className="font-display text-2xl text-game-ink">🔎 {mission.prompt[lang]}</h3>{!objectLevel && feedback !== "right" && <div className="mt-4"><TrendChoices lang={lang} onChoose={answer}/></div>}{objectLevel && feedback === "idle" && <p className="mt-2 font-semibold text-game-muted">{lang === "bn" ? "এখন-এর ছবিতে গাছ বা ভবনে চাপ দাও।" : "Tap a tree or building in the NOW picture."}</p>}
        {objectLevel && feedback !== "right" && <div className="mt-4 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => answer(true)} className="h-auto min-h-16 border-2 border-game-ink bg-game-paper text-base font-black text-game-ink shadow-game hover:bg-game-yellow">{mission.id === "sundarbans" ? (lang === "bn" ? "🌳 ম্যানগ্রোভ গাছ" : "🌳 Mangrove trees") : (lang === "bn" ? "🏙️ ভবন" : "🏙️ Buildings")}</Button>
          <Button type="button" variant="outline" onClick={() => answer(false)} className="h-auto min-h-16 border-2 border-game-ink bg-game-paper text-base font-black text-game-ink shadow-game hover:bg-game-yellow">{mission.id === "sundarbans" ? (lang === "bn" ? "⛵ নৌকা" : "⛵ Boat") : (lang === "bn" ? "🚗 গাড়ি" : "🚗 Cars")}</Button>
        </div>}
        {feedback === "wrong" && <div className="td-feedback-wrong mt-4 animate-fade-in rounded-2xl border-2 border-game-red bg-game-paper p-4 font-bold text-game-red" role="status">🤔 {lang === "bn" ? "প্রায় হয়েছে! দুইটি ছবি আবার ভালো করে দেখো।" : "Almost! Look closely at both pictures and try again."}</div>}
        {feedback === "right" && <div className="td-celebrate relative mt-4 overflow-hidden rounded-2xl border-4 border-game-ink bg-game-yellow p-4 text-game-ink shadow-game" role="status"><span className="td-sparkle left-[12%] top-2">✦</span><span className="td-sparkle right-[14%] top-5">★</span><div className="mx-auto w-20"><Detective celebrate /></div><p className="font-display text-2xl">✨ {mission.success[lang]}</p><p className="mt-1 font-black">🔎 {lang === "bn" ? "সূত্র ব্যাজ অর্জিত!" : "Clue Badge earned!"}</p><Button type="button" onClick={onBack} className="mt-3 border-2 border-game-ink bg-game-green text-game-ink shadow-game hover:bg-game-green/80">{lang === "bn" ? "পরের জায়গা বেছে নাও" : "Choose another place"}</Button></div>}
      </div>
    </div>
  </div>;
}

function FinalMission({ lang, onBack, onWin, alreadyWon }: { lang: "en" | "bn"; onBack: () => void; onWin: (newCorrect: number) => void; alreadyWon: boolean }) {
  const [answers, setAnswers] = useState<Partial<Record<MissionId, Trend>>>({});
  const [checked, setChecked] = useState(false);
  const allAnswered = MISSIONS.every((m) => answers[m.id]);
  const correctCount = MISSIONS.filter((m) => answers[m.id] === m.correct).length;
  const check = () => { setChecked(true); if (correctCount === MISSIONS.length) onWin(alreadyWon ? 0 : correctCount); };
  return <div className="td-paper rounded-3xl border-4 border-game-ink p-4 shadow-game sm:p-7"><div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={onBack} className="text-game-ink hover:bg-game-paper"><ArrowLeft /> {lang === "bn" ? "মানচিত্র" : "Map"}</Button><span className="rounded-full border-2 border-game-ink bg-game-yellow px-3 py-1 text-xs font-black text-game-ink">🌍 {lang === "bn" ? "চূড়ান্ত মিশন" : "FINAL MISSION"}</span></div>
    <div className="mx-auto mt-2 max-w-2xl text-center"><div className="mx-auto w-28"><Detective /></div><h2 className="font-display text-3xl text-game-ink">{lang === "bn" ? "বাহ! তুমি সব সূত্র সংগ্রহ করেছ।" : "Wow! You collected all the clues."}</h2><p className="mt-2 font-semibold text-game-muted">{lang === "bn" ? "প্রতিটি ছবির প্রবণতা মিলিয়ে বাংলাদেশের রহস্য সমাধান করো।" : "Match each picture clue to its trend and solve the Bangladesh mystery."}</p></div>
    <div className="mx-auto mt-6 grid max-w-3xl gap-3">{MISSIONS.map((m) => <div key={m.id} className={`rounded-2xl border-2 p-3 ${checked ? answers[m.id] === m.correct ? "border-game-green bg-game-green/20" : "border-game-red bg-game-red/10" : "border-game-ink bg-game-paper"}`}><div className="flex items-center gap-3"><span className="text-3xl">{m.icon}</span><div className="min-w-0 flex-1"><p className="font-black text-game-ink">{m.clue[lang]}</p><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(TREND_LABELS) as Trend[]).map((trend) => <Button key={trend} type="button" size="sm" variant={answers[m.id] === trend ? "default" : "outline"} disabled={checked} onClick={() => setAnswers((a) => ({ ...a, [m.id]: trend }))} className={answers[m.id] === trend ? "border-2 border-game-ink bg-game-blue text-game-paper" : "border-2 border-game-ink bg-game-paper text-game-ink"}>{TREND_LABELS[trend].icon} {TREND_LABELS[trend].label[lang]}</Button>)}</div></div>{checked && answers[m.id] === m.correct && <Check className="size-7 text-game-green" />}</div></div>)}</div>
    <div className="mt-5 text-center">{checked && correctCount < MISSIONS.length && <p className="mb-3 font-bold text-game-red" role="status">{lang === "bn" ? `${correctCount.toLocaleString("bn-BD")}/৪টি ঠিক। ভুলগুলো দেখে আবার চেষ্টা করো!` : `${correctCount}/4 correct. Check the pictures and try again!`}</p>}<Button type="button" size="lg" disabled={!allAnswered} onClick={checked && correctCount < MISSIONS.length ? () => setChecked(false) : check} className="h-12 border-2 border-game-ink bg-game-red px-7 font-black text-game-paper shadow-game">{checked && correctCount < MISSIONS.length ? (lang === "bn" ? "আবার চেষ্টা করো" : "Try again") : (lang === "bn" ? "রহস্য সমাধান করো" : "Solve the mystery")}</Button></div>
  </div>;
}

function AwardScreen({ lang, stars, onRestart }: { lang: "en" | "bn"; stars: number; onRestart: () => void }) {
  return <div className="td-paper td-award relative overflow-hidden rounded-[2rem] border-4 border-game-paper p-6 text-center shadow-game sm:p-10"><div className="td-confetti" aria-hidden="true">★ ✦ ● ★ ✦ ● ★</div><WeatherFriends/><div className="mx-auto w-40"><Detective celebrate /></div><div className="mx-auto mt-2 inline-flex size-28 items-center justify-center rounded-full border-4 border-game-ink bg-game-yellow text-6xl shadow-game">🏆</div><h2 className="mt-4 td-game-title text-3xl sm:text-5xl">{lang === "bn" ? "অভিনন্দন, ছোট্ট গোয়েন্দা!" : "Congratulations, little detective!"}</h2><p className="mx-auto mt-3 max-w-xl text-lg font-bold text-game-muted">🌍🔎 {lang === "bn" ? "তুমি ছবি দেখে পরিবর্তন খুঁজে বাংলাদেশের সব রহস্য সমাধান করেছ!" : "You observed changes and solved every Bangladesh mystery!"}</p><div className="mx-auto mt-5 max-w-md rounded-2xl border-4 border-game-ink bg-game-blue p-5 text-game-paper shadow-game"><p className="text-xs font-black uppercase">{lang === "bn" ? "তোমার নতুন ব্যাজ" : "Your new badge"}</p><p className="mt-1 text-2xl font-black">🇧🇩 {lang === "bn" ? "আমার হাতে বাংলাদেশ" : "Bangladesh in My Hands"}</p><p className="mt-2 font-black">⭐ {stars} {lang === "bn" ? "গোয়েন্দা তারা" : "Detective Stars"}</p></div><p className="mt-6 text-xl font-black text-game-ink">🇧🇩 “{lang === "bn" ? "দেখো। ভাবো। পরিবর্তন খোঁজো।" : "Look. Think. Find the change."}”</p><Button type="button" size="lg" onClick={onRestart} className="td-pressable mt-5 border-2 border-game-ink bg-game-green font-black text-game-ink shadow-game hover:bg-game-green/80"><RotateCcw /> {lang === "bn" ? "আবার অভিযান শুরু করো" : "Play again"}</Button></div>;
}

export function TrendDetectiveGame() {
  const { lang } = useLang();
  const [screen, setScreen] = useState<Screen>("map");
  const [completed, setCompleted] = useState<Set<MissionId>>(new Set());
  const [stars, setStars] = useState(0);
  const [won, setWon] = useState(false);
  const activeMission = useMemo(() => MISSIONS.find((m) => m.id === screen), [screen]);
  const complete = (id: MissionId) => { if (!completed.has(id)) { setCompleted((old) => new Set(old).add(id)); setStars((s) => s + 1); } };
  const restart = () => { setCompleted(new Set()); setStars(0); setWon(false); setScreen("map"); };
  if (screen === "map") return <MapScreen lang={lang} completed={completed} stars={stars} onOpen={setScreen} onFinal={() => setScreen("final")}/>;
  if (screen === "final") return <FinalMission lang={lang} alreadyWon={won} onBack={() => setScreen("map")} onWin={(bonus) => { setStars((s) => s + bonus); setWon(true); setScreen("award"); }}/>;
  if (screen === "award") return <AwardScreen lang={lang} stars={stars} onRestart={restart}/>;
  if (!activeMission) return null;
  return <MissionScreen mission={activeMission} lang={lang} completed={completed.has(activeMission.id)} onBack={() => setScreen("map")} onComplete={() => complete(activeMission.id)}/>;
}