import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { usePublishedQuiz } from "@/lib/public-content";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "Kids' Climate Game — TerraBangla" },
      {
        name: "description",
        content:
          "An animated bilingual walkthrough for ages 8-14: why the climate is changing, how we fix it, and a quiz.",
      },
      { property: "og:title", content: "Kids' Climate Game" },
      {
        property: "og:description",
        content: "Animated English and Bangla climate lessons with an instant-feedback quiz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidsPage,
});

type T2 = { en: string; bn: string };
interface Step { icon: string; anim: string; title: T2; body: T2 }

const CAUSES: Step[] = [
  { icon: "☀️", anim: "animate-pulse", title: { en: "Sunlight warms the Earth", bn: "সূর্যের আলো পৃথিবীকে গরম করে" }, body: { en: "The Sun sends light to Earth. The ground soaks it up and gives off heat.", bn: "সূর্য পৃথিবীতে আলো পাঠায়। মাটি তা শুষে নিয়ে তাপ ছাড়ে।" } },
  { icon: "🫧", anim: "animate-bounce", title: { en: "Greenhouse gases are a blanket", bn: "গ্রিনহাউস গ্যাস একটা কম্বলের মতো" }, body: { en: "Gases like carbon dioxide trap some heat, like a blanket. More gas means a thicker, hotter blanket.", bn: "কার্বন ডাই-অক্সাইডের মতো গ্যাস কম্বলের মতো তাপ আটকে রাখে। গ্যাস বাড়লে কম্বল মোটা হয়, গরমও বাড়ে।" } },
  { icon: "🏭", anim: "animate-pulse", title: { en: "Burning fossil fuels", bn: "জীবাশ্ম জ্বালানি পোড়ানো" }, body: { en: "Cars, factories and power plants burn coal, oil and gas. That smoke adds carbon dioxide to the air.", bn: "গাড়ি, কারখানা আর বিদ্যুৎকেন্দ্র কয়লা, তেল ও গ্যাস পোড়ায়। সেই ধোঁয়া বাতাসে কার্বন ডাই-অক্সাইড বাড়ায়।" } },
  { icon: "🪓", anim: "animate-bounce", title: { en: "Cutting down forests", bn: "বন কেটে ফেলা" }, body: { en: "Trees drink carbon dioxide. When forests are cut, less gas is cleaned and the stored carbon escapes.", bn: "গাছ কার্বন ডাই-অক্সাইড শুষে নেয়। বন কাটলে কম গ্যাস পরিষ্কার হয় আর জমা কার্বন বেরিয়ে যায়।" } },
  { icon: "🌡️", anim: "animate-pulse", title: { en: "Bangladesh feels it", bn: "বাংলাদেশ তা টের পায়" }, body: { en: "NASA data shows Bangladesh getting warmer. Hotter days, stronger storms and rising seas affect our families.", bn: "নাসার তথ্য দেখায় বাংলাদেশ আরও গরম হচ্ছে। বেশি গরম দিন, শক্তিশালী ঝড় আর সমুদ্রের পানি বাড়া আমাদের পরিবারকে প্রভাবিত করে।" } },
];

const SOLUTIONS: Step[] = [
  { icon: "🌳", anim: "animate-bounce", title: { en: "Plant trees", bn: "গাছ লাগাও" }, body: { en: "Every tree cleans the air, gives shade and keeps soil safe from floods.", bn: "প্রতিটি গাছ বাতাস পরিষ্কার করে, ছায়া দেয় আর বন্যা থেকে মাটি রক্ষা করে।" } },
  { icon: "🔆", anim: "animate-pulse", title: { en: "Use clean energy", bn: "পরিষ্কার শক্তি ব্যবহার করো" }, body: { en: "Solar panels and wind turbines make electricity without smoke. Bangladesh has millions of solar home systems!", bn: "সোলার প্যানেল আর বায়ুকল ধোঁয়া ছাড়াই বিদ্যুৎ বানায়। বাংলাদেশে লক্ষ লক্ষ সোলার হোম সিস্টেম আছে!" } },
  { icon: "♻️", anim: "animate-spin-slow", title: { en: "Reduce, reuse, recycle", bn: "কম ব্যবহার, আবার ব্যবহার, পুনর্ব্যবহার" }, body: { en: "Less waste means fewer factories burning fuel. Carry a cloth bag and fix things instead of throwing them away.", bn: "কম বর্জ্য মানে কম জ্বালানি পোড়ানো। কাপড়ের ব্যাগ নাও আর জিনিস ফেলে না দিয়ে মেরামত করো।" } },
  { icon: "🚲", anim: "animate-bounce", title: { en: "Walk, cycle, share rides", bn: "হাঁটো, সাইকেল চালাও, একসাথে যাও" }, body: { en: "Short trips on foot or by bicycle keep the air cleaner and you healthier.", bn: "কাছের পথে হেঁটে বা সাইকেলে গেলে বাতাস পরিষ্কার থাকে আর তুমিও সুস্থ থাকো।" } },
  { icon: "💡", anim: "animate-pulse", title: { en: "Switch off, save power", bn: "বন্ধ করো, বিদ্যুৎ বাঁচাও" }, body: { en: "Turn off lights and fans when you leave a room. Saved power means less fuel burned.", bn: "ঘর ছাড়ার সময় বাতি ও পাখা বন্ধ করো। বিদ্যুৎ বাঁচলে কম জ্বালানি পোড়ে।" } },
];

interface Q { q: T2; options: T2[]; answer: number; why: T2 }
const BUILT_IN_QUIZ: Q[] = [
  { q: { en: "Which gas traps heat like a blanket?", bn: "কোন গ্যাস কম্বলের মতো তাপ আটকে রাখে?" }, options: [{ en: "Oxygen", bn: "অক্সিজেন" }, { en: "Carbon dioxide", bn: "কার্বন ডাই-অক্সাইড" }, { en: "Helium", bn: "হিলিয়াম" }], answer: 1, why: { en: "Carbon dioxide is a greenhouse gas that keeps heat near the Earth.", bn: "কার্বন ডাই-অক্সাইড একটি গ্রিনহাউস গ্যাস যা তাপ পৃথিবীর কাছে ধরে রাখে।" } },
  { q: { en: "What do trees take out of the air?", bn: "গাছ বাতাস থেকে কী নেয়?" }, options: [{ en: "Carbon dioxide", bn: "কার্বন ডাই-অক্সাইড" }, { en: "Water vapour only", bn: "শুধু জলীয় বাষ্প" }, { en: "Smoke colour", bn: "ধোঁয়ার রং" }], answer: 0, why: { en: "Trees use carbon dioxide to grow, cleaning the air.", bn: "গাছ বড় হতে কার্বন ডাই-অক্সাইড ব্যবহার করে, বাতাস পরিষ্কার করে।" } },
  { q: { en: "Which is a fossil fuel?", bn: "কোনটি জীবাশ্ম জ্বালানি?" }, options: [{ en: "Sunlight", bn: "সূর্যের আলো" }, { en: "Wind", bn: "বাতাস" }, { en: "Coal", bn: "কয়লা" }], answer: 2, why: { en: "Coal formed from ancient plants over millions of years, and burning it releases CO₂.", bn: "কয়লা লক্ষ লক্ষ বছরের পুরোনো গাছ থেকে তৈরি; পোড়ালে CO₂ বের হয়।" } },
  { q: { en: "Which makes electricity without smoke?", bn: "কোনটি ধোঁয়া ছাড়া বিদ্যুৎ বানায়?" }, options: [{ en: "Diesel generator", bn: "ডিজেল জেনারেটর" }, { en: "Solar panel", bn: "সোলার প্যানেল" }, { en: "Burning wood", bn: "কাঠ পোড়ানো" }], answer: 1, why: { en: "Solar panels turn sunlight straight into electricity.", bn: "সোলার প্যানেল সূর্যের আলোকে সরাসরি বিদ্যুতে বদলায়।" } },
  { q: { en: "What happens when forests are cut down?", bn: "বন কাটলে কী হয়?" }, options: [{ en: "Air gets cleaner", bn: "বাতাস পরিষ্কার হয়" }, { en: "More CO₂ stays in the air", bn: "বাতাসে বেশি CO₂ থাকে" }, { en: "It snows more", bn: "বেশি তুষার পড়ে" }], answer: 1, why: { en: "Fewer trees means less CO₂ is removed from the air.", bn: "গাছ কম হলে বাতাস থেকে কম CO₂ সরানো হয়।" } },
  { q: { en: "Which habit helps the climate?", bn: "কোন অভ্যাস জলবায়ুকে সাহায্য করে?" }, options: [{ en: "Leaving fans on all day", bn: "সারাদিন পাখা চালু রাখা" }, { en: "Using a new plastic bag each time", bn: "প্রতিবার নতুন প্লাস্টিক ব্যাগ" }, { en: "Cycling to a nearby shop", bn: "কাছের দোকানে সাইকেলে যাওয়া" }], answer: 2, why: { en: "Cycling uses no fuel and makes no smoke.", bn: "সাইকেল চালাতে জ্বালানি লাগে না, ধোঁয়াও হয় না।" } },
  { q: { en: "How do scientists know Bangladesh is warming?", bn: "বিজ্ঞানীরা কীভাবে জানেন বাংলাদেশ গরম হচ্ছে?" }, options: [{ en: "By measuring temperature for many years", bn: "অনেক বছর ধরে তাপমাত্রা মেপে" }, { en: "By guessing", bn: "অনুমান করে" }, { en: "From one hot day", bn: "একটা গরম দিন দেখে" }], answer: 0, why: { en: "A trend needs many years of data — like the NASA records on this site.", bn: "প্রবণতা বুঝতে অনেক বছরের তথ্য লাগে — যেমন এই সাইটের নাসার রেকর্ড।" } },
];

function Walkthrough({ steps, tone }: { steps: Step[]; tone: "warn" | "good" }) {
  const { lang } = useLang();
  const L = (x: T2) => (lang === "bn" ? x.bn : x.en);
  const [i, setI] = useState(0);
  const s = steps[i]!;
  return (
    <div className="panel p-5">
      <div key={i} className="flex flex-col items-center text-center animate-fade-in sm:flex-row sm:text-left sm:gap-6">
        <div
          aria-hidden
          className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-6xl ${tone === "warn" ? "bg-[color-mix(in_oklab,var(--rising)_20%,transparent)]" : "bg-[color-mix(in_oklab,#3EC98A_20%,transparent)]"}`}
        >
          <span className={`inline-block motion-reduce:animate-none ${s.anim}`}>{s.icon}</span>
        </div>
        <div className="mt-3 sm:mt-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {lang === "bn" ? `ধাপ ${(i + 1).toLocaleString("bn-BD")} / ${steps.length.toLocaleString("bn-BD")}` : `Step ${i + 1} of ${steps.length}`}
          </p>
          <h3 className="font-display text-2xl text-foreground">{L(s.title)}</h3>
          <p className="mt-2 text-base text-foreground/90" aria-live="polite">{L(s.body)}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-full border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40">
          {lang === "bn" ? "← আগে" : "← Back"}
        </button>
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((_, k) => (
            <span key={k} className={`h-2 w-2 rounded-full ${k === i ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <button type="button" disabled={i === steps.length - 1} onClick={() => setI(i + 1)} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">
          {lang === "bn" ? "পরে →" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function Quiz() {
  const published = usePublishedQuiz();
  // Admin-published questions replace the built-in set when any exist.
  const QUIZ: Q[] = published && published.length > 0 ? published : BUILT_IN_QUIZ;
  const { lang } = useLang();
  const L = (x: T2) => (lang === "bn" ? x.bn : x.en);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  // Score kept in local state; shape ready for a future badge/progress system.
  const [score, setScore] = useState({ correct: 0, answered: 0, history: [] as boolean[] });
  const done = idx >= QUIZ.length;
  const n = (x: number) => (lang === "bn" ? x.toLocaleString("bn-BD") : String(x));

  if (done) {
    return (
      <div className="panel p-6 text-center" aria-live="polite">
        <div className="text-6xl motion-safe:animate-bounce" aria-hidden>{score.correct >= Math.ceil(QUIZ.length * 0.7) ? "🏆" : "🌱"}</div>
        <h3 className="mt-2 font-display text-2xl text-foreground">
          {lang === "bn" ? `তোমার স্কোর: ${n(score.correct)} / ${n(QUIZ.length)}` : `Your score: ${score.correct} / ${QUIZ.length}`}
        </h3>
        <p className="mt-2 text-muted-foreground">
          {score.correct >= Math.ceil(QUIZ.length * 0.7)
            ? lang === "bn" ? "দারুণ! তুমি একজন ক্লাইমেট গোয়েন্দা!" : "Brilliant! You are a climate detective!"
            : lang === "bn" ? "ভালো চেষ্টা! আবার খেলে দেখো।" : "Good try! Play again to learn more."}
        </p>
        <button type="button" onClick={() => { setIdx(0); setPicked(null); setScore({ correct: 0, answered: 0, history: [] }); }} className="mt-4 rounded-full bg-primary px-5 py-2 text-primary-foreground">
          {lang === "bn" ? "আবার খেলো" : "Play again"}
        </button>
      </div>
    );
  }

  const q = QUIZ[idx]!;
  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === q.answer;
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), answered: s.answered + 1, history: [...s.history, ok] }));
  };
  return (
    <div className="panel p-5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lang === "bn" ? `প্রশ্ন ${n(idx + 1)} / ${n(QUIZ.length)}` : `Question ${idx + 1} of ${QUIZ.length}`}</span>
        <span>{lang === "bn" ? `স্কোর ${n(score.correct)}` : `Score ${score.correct}`}</span>
      </div>
      <h3 className="mt-2 font-display text-xl text-foreground">{L(q.q)}</h3>
      <div className="mt-4 grid gap-2">
        {q.options.map((o, k) => {
          const state = picked === null ? "" : k === q.answer ? "border-[#3EC98A] bg-[color-mix(in_oklab,#3EC98A_15%,transparent)]" : k === picked ? "border-[var(--declining)] bg-[color-mix(in_oklab,var(--declining)_15%,transparent)]" : "opacity-60";
          return (
            <button key={k} type="button" onClick={() => choose(k)} aria-disabled={picked !== null} className={`rounded-xl border border-border px-4 py-3 text-left text-foreground transition hover:bg-secondary ${state}`}>
              {L(o)}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 animate-fade-in" aria-live="polite">
          <p className={`font-semibold ${picked === q.answer ? "text-[#3EC98A]" : "text-[var(--declining)]"}`}>
            {picked === q.answer ? (lang === "bn" ? "✓ সঠিক!" : "✓ Correct!") : lang === "bn" ? "✗ ঠিক হয়নি" : "✗ Not quite"}
          </p>
          <p className="mt-1 text-sm text-foreground/90">{L(q.why)}</p>
          <button type="button" autoFocus onClick={() => { setIdx(idx + 1); setPicked(null); }} className="mt-3 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
            {idx === QUIZ.length - 1 ? (lang === "bn" ? "ফলাফল দেখো" : "See result") : lang === "bn" ? "পরের প্রশ্ন →" : "Next question →"}
          </button>
        </div>
      )}
    </div>
  );
}

function KidsPage() {
  const { t, lang } = useLang();
  return (
    <div className="mx-auto max-w-4xl px-3 py-8 sm:px-6">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t("kids.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {lang === "bn" ? "৮-১৪ বছর বয়সীদের জন্য। জানো, তারপর কুইজ খেলো!" : "For ages 8–14. Learn, then play the quiz!"}
      </p>
      <section className="mt-8" aria-labelledby="partA">
        <h2 id="partA" className="mb-3 font-display text-2xl text-[var(--rising)]">
          {lang === "bn" ? "পর্ব ক: তাপমাত্রা কেন বাড়ছে?" : "Part A: Why is it getting hotter?"}
        </h2>
        <Walkthrough steps={CAUSES} tone="warn" />
      </section>
      <section className="mt-8" aria-labelledby="partB">
        <h2 id="partB" className="mb-3 font-display text-2xl text-[#3EC98A]">
          {lang === "bn" ? "পর্ব খ: আমরা কী করতে পারি?" : "Part B: What can we do?"}
        </h2>
        <Walkthrough steps={SOLUTIONS} tone="good" />
      </section>
      <section className="mt-8" aria-labelledby="quiz">
        <h2 id="quiz" className="mb-3 font-display text-2xl text-primary">
          {lang === "bn" ? "কুইজ" : "Quiz"}
        </h2>
        <Quiz />
      </section>
    </div>
  );
}
