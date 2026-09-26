import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { usePublishedQuiz } from "@/lib/public-content";
import { TrendDetectiveGame } from "@/components/TrendDetectiveGame";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "আমার হাতে বাংলাদেশ — TerraBangla Kids Game" },
      {
        name: "description",
        content:
          "আমার হাতে বাংলাদেশ is a colorful bilingual picture adventure where children ages 7–12 observe change across Bangladesh.",
      },
      { property: "og:title", content: "আমার হাতে বাংলাদেশ — A Children’s Adventure" },
      {
        property: "og:description",
        content: "Travel a playful Bangladesh adventure path, solve four illustrated mysteries, and collect detective stars.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidsPage,
});

type T2 = { en: string; bn: string };

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
        <Button type="button" onClick={() => { setIdx(0); setPicked(null); setScore({ correct: 0, answered: 0, history: [] }); }} className="mt-4">
          {lang === "bn" ? "আবার খেলো" : "Play again"}
        </Button>
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
            <Button key={k} type="button" variant="outline" onClick={() => choose(k)} aria-disabled={picked !== null} className={`h-auto min-h-12 justify-start whitespace-normal rounded-xl px-4 py-3 text-left ${state}`}>
              {L(o)}
            </Button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 animate-fade-in" aria-live="polite">
          <p className={`font-semibold ${picked === q.answer ? "text-[#3EC98A]" : "text-[var(--declining)]"}`}>
            {picked === q.answer ? (lang === "bn" ? "✓ সঠিক!" : "✓ Correct!") : lang === "bn" ? "✗ ঠিক হয়নি" : "✗ Not quite"}
          </p>
          <p className="mt-1 text-sm text-foreground/90">{L(q.why)}</p>
          <Button type="button" autoFocus onClick={() => { setIdx(idx + 1); setPicked(null); }} className="mt-3">
            {idx === QUIZ.length - 1 ? (lang === "bn" ? "ফলাফল দেখো" : "See result") : lang === "bn" ? "পরের প্রশ্ন →" : "Next question →"}
          </Button>
        </div>
      )}
    </div>
  );
}

function KidsPage() {
  const { lang } = useLang();
  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-9">
      <h1 className="sr-only">আমার হাতে বাংলাদেশ — Bangladesh in My Hands</h1>
      <TrendDetectiveGame />
      <section className="mx-auto mt-10 max-w-4xl" aria-labelledby="quiz">
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-muted-foreground">{lang === "bn" ? "অতিরিক্ত অনুশীলন" : "Bonus activity"}</p><h2 id="quiz" className="font-display text-2xl text-primary">{lang === "bn" ? "দ্রুত কুইজ" : "Quick quiz"}</h2></div><span className="text-3xl" aria-hidden="true">🧠</span></div>
        <Quiz />
      </section>
    </div>
  );
}
