import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Captions,
  Check,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import { analyzeVariable, getDistrict } from "@/lib/climate";
import { fmt, useLang } from "@/lib/i18n";
import {
  KIDS_STORY,
  type StoryScene,
  type StorySound,
  type StoryText,
} from "@/lib/kids-story";
import earth from "@/assets/story/story-earth.jpg";
import nightScene from "@/assets/story/scenes/night.jpg";
import guideScene from "@/assets/story/scenes/guide.jpg";
import deltaScene from "@/assets/story/scenes/delta.jpg";
import signalsScene from "@/assets/story/scenes/signals.jpg";
import greenScene from "@/assets/story/scenes/green.jpg";
import landScene from "@/assets/story/scenes/land.jpg";
import airScene from "@/assets/story/scenes/air.jpg";
import sunScene from "@/assets/story/scenes/sun.jpg";
import rainScene from "@/assets/story/scenes/rain.jpg";
import dotsScene from "@/assets/story/scenes/dots.jpg";
import testScene from "@/assets/story/scenes/test.jpg";
import rateScene from "@/assets/story/scenes/rate.jpg";
import journalScene from "@/assets/story/scenes/journal.jpg";
import challengeScene from "@/assets/story/scenes/challenge.jpg";
import celebrating from "@/assets/mascot/celebrating.png.asset.json";
import encouraging from "@/assets/mascot/encouraging.png.asset.json";
import idle from "@/assets/mascot/idle.png.asset.json";
import thinking from "@/assets/mascot/thinking.png.asset.json";
import waving from "@/assets/mascot/waving.png.asset.json";

const SCENE_ART: Record<string, string> = {
  night: nightScene,
  guide: guideScene,
  delta: deltaScene,
  signals: signalsScene,
  green: greenScene,
  land: landScene,
  air: airScene,
  sun: sunScene,
  rain: rainScene,
  dots: dotsScene,
  test: testScene,
  rate: rateScene,
  journal: journalScene,
  challenge: challengeScene,
};
type StoryMood = "welcoming" | "curious" | "thinking" | "encouraging" | "happy";
type VoiceState = "idle" | "speaking" | "paused";

const POSES: Record<StoryMood, string> = {
  welcoming: waving.url,
  curious: encouraging.url,
  thinking: thinking.url,
  encouraging: idle.url,
  happy: celebrating.url,
};

const MOODS: Record<string, StoryMood> = {
  night: "welcoming",
  guide: "happy",
  delta: "curious",
  signals: "encouraging",
  green: "curious",
  land: "thinking",
  air: "thinking",
  sun: "happy",
  rain: "curious",
  dots: "thinking",
  test: "encouraging",
  rate: "thinking",
  journal: "happy",
  challenge: "welcoming",
};

const QUESTIONS = [
  { q: { en: "What makes a climate trend stronger than one unusual day?", bn: "একটি অস্বাভাবিক দিনের চেয়ে জলবায়ু প্রবণতাকে কী শক্তিশালী করে?" }, o: [{ en: "Many years of observations", bn: "বহু বছরের পর্যবেক্ষণ" }, { en: "A brighter illustration", bn: "আরও উজ্জ্বল ছবি" }, { en: "A guess", bn: "একটি অনুমান" }], a: 0, w: { en: "Scientists test the full sequence of annual records.", bn: "বিজ্ঞানীরা বার্ষিক রেকর্ডের পুরো ধারাবাহিকতা পরীক্ষা করেন।" } },
  { q: { en: "What does NDVI help us compare?", bn: "NDVI কী তুলনা করতে সাহায্য করে?" }, o: [{ en: "Plant greenness", bn: "উদ্ভিদের সবুজের পরিমাণ" }, { en: "River depth", bn: "নদীর গভীরতা" }, { en: "Wind speed", bn: "বাতাসের গতি" }], a: 0, w: { en: "NDVI is a satellite-derived vegetation signal.", bn: "NDVI হলো স্যাটেলাইট থেকে পাওয়া উদ্ভিদের একটি সংকেত।" } },
  { q: { en: "Are land temperature and air temperature the same record?", bn: "ভূপৃষ্ঠ ও বায়ুর তাপমাত্রা কি একই রেকর্ড?" }, o: [{ en: "Yes, always", bn: "হ্যাঁ, সবসময়" }, { en: "No, they are measured separately", bn: "না, এগুলো আলাদাভাবে মাপা হয়" }, { en: "Only in cities", bn: "শুধু শহরে" }], a: 1, w: { en: "Ground surfaces and the surrounding air behave differently.", bn: "ভূপৃষ্ঠ ও চারপাশের বাতাস আলাদাভাবে আচরণ করে।" } },
  { q: { en: "What does Mann–Kendall test?", bn: "Mann–Kendall কী পরীক্ষা করে?" }, o: [{ en: "Trend direction through time", bn: "সময়ের সঙ্গে প্রবণতার দিক" }, { en: "A satellite's speed", bn: "স্যাটেলাইটের গতি" }, { en: "A map's color", bn: "মানচিত্রের রং" }], a: 0, w: { en: "It checks whether values consistently move upward or downward.", bn: "এটি মান ধারাবাহিকভাবে বাড়ে বা কমে কি না যাচাই করে।" } },
  { q: { en: "If a result is not statistically significant, what is the honest conclusion?", bn: "ফল পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ না হলে সৎ সিদ্ধান্ত কী?" }, o: [{ en: "A dramatic change", bn: "বড় পরিবর্তন" }, { en: "No clear change", bn: "স্পষ্ট পরিবর্তন নেই" }, { en: "Delete the data", bn: "তথ্য মুছে ফেলো" }], a: 1, w: { en: "Different endpoints alone do not prove a long-term change.", bn: "শুধু আলাদা শেষবিন্দু দীর্ঘমেয়াদি পরিবর্তন প্রমাণ করে না।" } },
  { q: { en: "What estimates the rate of change?", bn: "পরিবর্তনের হার কী হিসাব করে?" }, o: [{ en: "Theil–Sen", bn: "Theil–Sen" }, { en: "A speech bubble", bn: "কথার বুদ্‌বুদ" }, { en: "The illustration", bn: "ছবি" }], a: 0, w: { en: "Theil–Sen gives a robust rate while unusual years have less influence.", bn: "Theil–Sen অস্বাভাবিক বছরের প্রভাব কমিয়ে একটি নির্ভরযোগ্য হার দেয়।" } },
  { q: { en: "Where must TerraBangla's climate numbers come from?", bn: "টেরাবাংলার জলবায়ুর সংখ্যা কোথা থেকে আসতে হবে?" }, o: [{ en: "Cached NASA records", bn: "সংরক্ষিত নাসা রেকর্ড" }, { en: "Character dialogue", bn: "চরিত্রের সংলাপ" }, { en: "AI imagination", bn: "এআই-এর কল্পনা" }], a: 0, w: { en: "Illustrations explain; cached observations are the evidence.", bn: "ছবি ব্যাখ্যা করে; সংরক্ষিত পর্যবেক্ষণই প্রমাণ।" } },
] satisfies [{ q: StoryText; o: StoryText[]; a: number; w: StoryText }, ...{ q: StoryText; o: StoryText[]; a: number; w: StoryText }[]];

function voiceScore(voice: SpeechSynthesisVoice, lang: "en" | "bn") {
  const name = voice.name.toLowerCase();
  const language = voice.lang.toLowerCase();
  let score = 0;
  if (lang === "bn" && (language.startsWith("bn") || name.includes("bangla") || name.includes("bengali"))) score += 100;
  if (lang === "en" && language.startsWith("en")) score += 100;
  if (name.includes("google") || name.includes("microsoft") || name.includes("samantha") || name.includes("natural")) score += 20;
  if (voice.localService) score += 5;
  return score;
}

function useStoryAudio(lang: "en" | "bn", muted: boolean) {
  const [status, setStatus] = useState<VoiceState>("idle");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const ctx = useRef<AudioContext | null>(null);
  const nodes = useRef<{ sources: OscillatorNode[]; gain: GainNode } | null>(null);
  const currentSound = useRef<StorySound>("space");

  const stopAmbience = useCallback(() => {
    nodes.current?.sources.forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
    });
    nodes.current = null;
  }, []);

  const fadeAmbience = useCallback(() => {
    const active = nodes.current;
    if (!active || !ctx.current) return;
    const now = ctx.current.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(Math.max(active.gain.gain.value, 0.0001), now);
    active.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    window.setTimeout(() => {
      active.sources.forEach((source) => {
        try { source.stop(); } catch { /* already stopped */ }
      });
      if (nodes.current === active) nodes.current = null;
    }, 200);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopAmbience();
    setStatus("idle");
  }, [stopAmbience]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const ambience = useCallback((sound: StorySound) => {
    if (muted) return;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return;
    ctx.current ??= new AudioContextConstructor();
    stopAmbience();
    const profiles: Record<StorySound, { frequencies: number[]; type: OscillatorType; volume: number }> = {
      space: { frequencies: [82, 123], type: "sine", volume: 0.006 },
      river: { frequencies: [146, 196], type: "sine", volume: 0.005 },
      forest: { frequencies: [196, 294], type: "triangle", volume: 0.0045 },
      city: { frequencies: [110, 165], type: "triangle", volume: 0.004 },
      rain: { frequencies: [233, 349], type: "triangle", volume: 0.004 },
      signal: { frequencies: [261, 392], type: "sine", volume: 0.004 },
      dawn: { frequencies: [174, 261, 349], type: "sine", volume: 0.0035 },
    };
    const profile = profiles[sound];
    const gain = ctx.current.createGain();
    const now = ctx.current.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.volume, now + 0.45);
    gain.connect(ctx.current.destination);
    const sources = profile.frequencies.map((frequency, index) => {
      const source = ctx.current?.createOscillator();
      if (!source) return null;
      source.type = profile.type;
      source.frequency.value = frequency;
      source.detune.value = index % 2 === 0 ? -5 : 5;
      source.connect(gain);
      source.start();
      return source;
    }).filter((source): source is OscillatorNode => source !== null);
    nodes.current = { sources, gain };
  }, [muted]);

  const speak = useCallback((text: string, sound: StorySound) => {
    stop();
    if (muted || !window.speechSynthesis) return;
    currentSound.current = sound;
    ambience(sound);
    const utterance = new SpeechSynthesisUtterance(text);
    const chosen = [...voices].sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0];
    if (chosen && voiceScore(chosen, lang) >= 100) utterance.voice = chosen;
    utterance.lang = lang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = lang === "bn" ? 0.82 : 0.88;
    utterance.pitch = lang === "bn" ? 1.1 : 1.08;
    utterance.volume = 1;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => { fadeAmbience(); setStatus("idle"); };
    utterance.onerror = () => { fadeAmbience(); setStatus("idle"); };
    window.speechSynthesis.speak(utterance);
  }, [ambience, fadeAmbience, lang, muted, stop, voices]);

  const togglePause = useCallback(() => {
    if (status === "speaking") {
      window.speechSynthesis.pause();
      stopAmbience();
      setStatus("paused");
    } else if (status === "paused") {
      window.speechSynthesis.resume();
      ambience(currentSound.current);
      setStatus("speaking");
    }
  }, [ambience, status, stopAmbience]);

  useEffect(() => stop, [lang, muted, stop]);
  useEffect(() => () => stop(), [stop]);
  return { speak, stop, status, togglePause };
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext } }

function FinalReview({ onReview }: { onReview: () => void }) {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const localize = (value: StoryText) => value[lang];

  if (index >= QUESTIONS.length) return (
    <section className="story-review story-review-finish">
      <BookOpenCheck />
      <p>{lang === "bn" ? "প্রমাণ পাঠ সম্পন্ন" : "Evidence reading complete"}</p>
      <h2>{lang === "bn" ? `${QUESTIONS.length.toLocaleString("bn-BD")}টির মধ্যে ${score.toLocaleString("bn-BD")}টি সঠিক` : `${score} of ${QUESTIONS.length} correct`}</h2>
      <p>{lang === "bn" ? "এখন তুমি স্থান, চলক, সময়, পরীক্ষা ও উৎস—সব মিলিয়ে প্রমাণ পড়তে পারো।" : "You can now read evidence by connecting place, variable, time, test and source."}</p>
      <div>
        <Button onClick={onReview}><ArrowLeft />{lang === "bn" ? "গল্প আবার দেখো" : "Review story"}</Button>
        <Button variant="outline" onClick={() => { setIndex(0); setPicked(null); setScore(0); }}><RotateCcw />{lang === "bn" ? "আবার উত্তর দাও" : "Try again"}</Button>
      </div>
    </section>
  );

  const question = QUESTIONS[index] ?? QUESTIONS[0];
  return (
    <section className="story-review" aria-labelledby="review-title">
      <div className="story-review-progress"><span>{lang === "bn" ? `প্রশ্ন ${index + 1} / ${QUESTIONS.length}` : `Question ${index + 1} of ${QUESTIONS.length}`}</span><i style={{ width: `${((index + (picked === null ? 0 : 1)) / QUESTIONS.length) * 100}%` }} /></div>
      <h2 id="review-title">{localize(question.q)}</h2>
      <div className="story-review-options">{question.o.map((option, optionIndex) => <Button key={option.en} variant="outline" disabled={picked !== null} className={picked === null ? "" : optionIndex === question.a ? "is-correct" : optionIndex === picked ? "is-wrong" : "is-muted"} onClick={() => { setPicked(optionIndex); if (optionIndex === question.a) setScore((value) => value + 1); }}>{picked !== null && optionIndex === question.a ? <Check /> : null}{localize(option)}</Button>)}</div>
      {picked !== null ? <div className="story-review-answer" role="status"><small>{lang === "bn" ? "এখান থেকে কী শিখলাম" : "What you learned"}</small><p>{localize(question.w)}</p><Button onClick={() => { setIndex((value) => value + 1); setPicked(null); }}>{index === QUESTIONS.length - 1 ? (lang === "bn" ? "ফলাফল দেখো" : "See result") : (lang === "bn" ? "পরের প্রশ্ন" : "Next question")}<ArrowRight /></Button></div> : null}
    </section>
  );
}

function narrationFor(scene: StoryScene, lang: "en" | "bn") {
  return `${scene.title[lang]}. ${scene.dialogue[lang]} ${scene.narration[lang]}`;
}

export function KidsStory() {
  const { lang, setLang } = useLang();
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const touchStart = useRef<number | null>(null);
  const { stop, speak, status, togglePause } = useStoryAudio(lang, muted);
  const scene = KIDS_STORY[active] ?? KIDS_STORY[0];
  const mood = MOODS[scene.id] ?? "encouraging";
  const localize = (value: StoryText) => value[lang];
  const analysis = useMemo(() => scene.evidence ? analyzeVariable(scene.evidence.districtId, scene.evidence.variable) : null, [scene]);
  const district = useMemo(() => scene.evidence ? getDistrict(scene.evidence.districtId) : null, [scene]);

  const playScene = useCallback((target: StoryScene) => {
    speak(narrationFor(target, lang), target.sound);
  }, [lang, speak]);

  const go = useCallback((next: number) => {
    stop();
    if (next >= KIDS_STORY.length) {
      setShowReview(true);
      return;
    }
    const bounded = Math.max(0, next);
    const target = KIDS_STORY[bounded] ?? KIDS_STORY[0];
    setShowReview(false);
    setActive(bounded);
    sessionStorage.setItem("tb-story-scene", String(bounded));
    playScene(target);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [playScene, stop]);

  useEffect(() => {
    if (!window.localStorage.getItem("mec-lang")) setLang("bn");
    const stored = Number(sessionStorage.getItem("tb-story-scene") ?? 0);
    if (Number.isFinite(stored)) setActive(Math.min(Math.max(stored, 0), KIDS_STORY.length - 1));
  }, [setLang]);

  useEffect(() => {
    [...Object.values(SCENE_ART), ...Object.values(POSES)].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (!started || showReview) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(active + 1);
      if (event.key === "ArrowLeft") go(active - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, go, showReview, started]);

  useEffect(() => {
    if (started && !showReview) stop();
  }, [lang, showReview, started, stop]);

  if (!started) return (
    <section className="story-gate">
      <img src={earth} alt="Tara and Rafi look toward Earth and Bangladesh" width={1536} height={1024} />
      <div>
        <p>{lang === "bn" ? "টেরাবাংলা কমিক যাত্রা" : "A TerraBangla comic journey"}</p>
        <h1>{lang === "bn" ? "প্রমাণের খাতা" : "The Evidence Journal"}</h1>
        <p>{lang === "bn" ? "তারা, রাফি আর নীলের সঙ্গে বাংলাদেশের জলবায়ু প্রমাণের গল্প আবিষ্কার করো। প্রতিটি নতুন দৃশ্যে চরিত্র, কণ্ঠ ও পটভূমি বদলাবে।" : "Join Tara, Rafi and Neel through Bangladesh's climate evidence. Every new scene changes its character, voice and setting."}</p>
        <Button size="lg" onClick={() => { setStarted(true); playScene(scene); window.scrollTo({ top: 0, behavior: "auto" }); }}><Play />{lang === "bn" ? "গল্প শুরু করো" : "Start story"}</Button>
      </div>
    </section>
  );

  if (showReview) return (
    <main className="story-slide-shell story-review-screen">
      <FinalReview onReview={() => go(0)} />
      <p className="story-honesty">{lang === "bn" ? "কমিকের ছবি ব্যাখ্যার জন্য। পরিমাপ করা প্রমাণ শুধু সংরক্ষিত NASA রেকর্ড ও নির্ধারিত পরিসংখ্যান থেকে আসে।" : "Comic artwork is explanatory. Measured evidence comes only from cached NASA records and deterministic statistics."}</p>
    </main>
  );

  return (
    <main
      className="story-slide-shell"
      data-scene={scene.id}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientX;
        if (touchStart.current === null || end === undefined) return;
        const distance = end - touchStart.current;
        if (Math.abs(distance) > 55) go(distance < 0 ? active + 1 : active - 1);
        touchStart.current = null;
      }}
    >
      <div className="story-backdrop" key={scene.id} aria-hidden><img src={SCENE_ART[scene.id] ?? nightScene} alt="" width={1536} height={1024} /></div>
      <header className="story-toolbar">
        <div><small>{lang === "bn" ? `অধ্যায় ${scene.chapter}` : `Chapter ${scene.chapter}`}</small><strong>{localize(scene.chapterTitle)}</strong></div>
        <span>{active + 1} / {KIDS_STORY.length}</span>
        <Button size="icon" variant="outline" onClick={() => status === "idle" ? playScene(scene) : togglePause()} aria-label={status === "speaking" ? (lang === "bn" ? "বিরতি" : "Pause") : status === "paused" ? (lang === "bn" ? "আবার চালাও" : "Resume") : (lang === "bn" ? "আবার শোনাও" : "Replay narration")}>{status === "speaking" ? <Pause /> : <Play />}</Button>
        <Button size="icon" variant="outline" onClick={() => setMuted((value) => !value)} aria-label={muted ? (lang === "bn" ? "শব্দ চালু" : "Unmute") : (lang === "bn" ? "শব্দ বন্ধ" : "Mute")}>{muted ? <VolumeX /> : <Volume2 />}</Button>
        <Button size="icon" variant={captions ? "secondary" : "outline"} onClick={() => setCaptions((value) => !value)} aria-label={lang === "bn" ? "ক্যাপশন" : "Captions"}><Captions /></Button>
      </header>
      <div className="story-progress" aria-hidden><i style={{ width: `${((active + 1) / KIDS_STORY.length) * 100}%` }} /></div>

      <section className="story-active-slide" key={`${scene.id}-${lang}`} aria-labelledby="story-slide-title">
        <div className="story-character-stage" data-mood={mood} data-motion={scene.id} data-speaking={status === "speaking" ? "true" : "false"}>
          <div className="story-character">
            <img src={POSES[mood]} alt="" aria-hidden draggable={false} />
          </div>
        </div>

        <article className="story-panel">
          <p className="story-panel-index">{String(active + 1).padStart(2, "0")} · {localize(scene.chapterTitle)}</p>
          <h2 id="story-slide-title">{localize(scene.title)}</h2>
          <div className="story-dialogue"><div><span>{localize(scene.speaker)}</span><p>“{localize(scene.dialogue)}”</p></div></div>
          {captions ? <p className="story-caption">{localize(scene.narration)}</p> : null}
          {analysis ? <div className="story-evidence" onClickCapture={stop}><div><small>{lang === "bn" ? "বাস্তব নাসা প্রমাণ" : "Real NASA evidence"}</small><strong>{lang === "bn" ? district?.bn : district?.name} · {analysis.label}</strong><p>{analysis.result.period.start}–{analysis.result.period.end} · {analysis.result.n_observations} {lang === "bn" ? "বার্ষিক পর্যবেক্ষণ" : "annual observations"} · {lang === "bn" ? "প্রতি দশকে" : "per decade"} {fmt(analysis.result.slope.slope_per_decade, lang, 2)} {analysis.unit}</p></div><ProvenanceButton provenance={analysis.provenance} payload={analysis} title={`${district?.name} · ${analysis.label}`} /></div> : null}
          <nav className="story-nav" aria-label={lang === "bn" ? "গল্পের দৃশ্য" : "Story scenes"}>
            <Button variant="outline" disabled={active === 0} onClick={() => go(active - 1)}><ArrowLeft />{lang === "bn" ? "আগের দৃশ্য" : "Previous"}</Button>
            <Button onClick={() => go(active + 1)}>{active === KIDS_STORY.length - 1 ? (lang === "bn" ? "শেষের প্রশ্ন" : "Final review") : (lang === "bn" ? "পরের দৃশ্য" : "Next")}<ArrowRight /></Button>
          </nav>
        </article>
      </section>
    </main>
  );
}