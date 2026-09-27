import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenCheck, Check, RotateCcw } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { usePublishedQuiz } from "@/lib/public-content";
import { DistrictLearning } from "@/components/DistrictLearning";
import { Button } from "@/components/ui/button";
import { KidsMascot, type MascotState } from "@/components/KidsMascot";
import { DistrictThemeBackdrop } from "@/components/DistrictThemeBackdrop";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "আমার হাতে বাংলাদেশ — TerraBangla Climate Learning Studio" },
      { name: "description", content: "A calm bilingual climate learning studio where students compare real cached NASA records across all 64 districts of Bangladesh." },
      { property: "og:title", content: "আমার হাতে বাংলাদেশ — TerraBangla Climate Learning Studio" },
      { property: "og:description", content: "Explore measured environmental change across Bangladesh through maps, time comparisons, and evidence checks." },
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

function KnowledgeCheck({ onMascotState }: { onMascotState: (state: MascotState) => void }) {
  const published = usePublishedQuiz();
  const questions: Q[] = published && published.length > 0 ? published : BUILT_IN_QUIZ;
  const { lang } = useLang();
  const localize = (value: T2) => lang === "bn" ? value.bn : value.en;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, answered: 0, history: [] as boolean[] });
  const done = index >= questions.length;
  const number = (value: number) => lang === "bn" ? value.toLocaleString("bn-BD") : String(value);

  if (done) return <div className="knowledge-finish" aria-live="polite"><BookOpenCheck aria-hidden /><p className="learn-section-label">{lang === "bn" ? "পর্যালোচনা সম্পন্ন" : "Review complete"}</p><h3>{lang === "bn" ? `${number(questions.length)}টির মধ্যে ${number(score.correct)}টি সঠিক পর্যবেক্ষণ` : `${score.correct} of ${questions.length} observations correct`}</h3><p>{lang === "bn" ? "প্রতিটি ব্যাখ্যা আবার পড়ে প্রমাণের সঙ্গে ধারণাগুলো মিলিয়ে নাও।" : "Revisit each explanation and connect the ideas to the evidence above."}</p><Button type="button" variant="outline" onClick={() => { onMascotState("thinking"); setIndex(0); setPicked(null); setScore({ correct: 0, answered: 0, history: [] }); }}><RotateCcw />{lang === "bn" ? "আবার পর্যালোচনা করো" : "Review again"}</Button></div>;

  const question = questions[index];
  if (!question) return null;
  const choose = (choice: number) => {
    if (picked !== null) return;
    setPicked(choice);
    const correct = choice === question.answer;
    onMascotState(correct ? "idle" : "encouraging");
    setScore((current) => ({ correct: current.correct + (correct ? 1 : 0), answered: current.answered + 1, history: [...current.history, correct] }));
  };

  return <div className="knowledge-card"><div className="knowledge-progress"><span>{lang === "bn" ? `পর্যবেক্ষণ ${number(index + 1)} / ${number(questions.length)}` : `Observation ${index + 1} of ${questions.length}`}</span><span>{lang === "bn" ? `${number(score.correct)}টি মিলেছে` : `${score.correct} matched`}</span></div><div className="knowledge-progress-line" aria-hidden><i style={{ width: `${((index + (picked === null ? 0 : 1)) / questions.length) * 100}%` }} /></div><h3>{localize(question.q)}</h3><div className="knowledge-options">{question.options.map((option, optionIndex) => { const state = picked === null ? "" : optionIndex === question.answer ? "is-correct" : optionIndex === picked ? "is-wrong" : "is-muted"; return <Button key={`${index}-${optionIndex}`} type="button" variant="outline" onClick={() => choose(optionIndex)} aria-disabled={picked !== null} className={state}>{picked !== null && optionIndex === question.answer ? <Check /> : null}{localize(option)}</Button>; })}</div>{picked !== null ? <div className="knowledge-explanation" aria-live="polite"><span>{picked === question.answer ? (lang === "bn" ? "প্রমাণের সঙ্গে মিলেছে" : "Matches the evidence") : (lang === "bn" ? "প্রমাণটি আরেকবার দেখো" : "Look at the evidence again")}</span><p>{localize(question.why)}</p><Button type="button" onClick={() => { onMascotState("thinking"); setIndex(index + 1); setPicked(null); }}>{index === questions.length - 1 ? (lang === "bn" ? "সারাংশ দেখো" : "View summary") : (lang === "bn" ? "পরের পর্যবেক্ষণ" : "Next observation")}<ArrowRightIcon /></Button></div> : null}</div>;
}

function ArrowRightIcon() { return <span aria-hidden>→</span>; }

function KidsPage() {
  const { lang, setLang } = useLang();
  const [mascotState, setMascotState] = useState<MascotState>("waving");
  const [districtId, setDistrictId] = useState("dhaka");
  const [guideContext, setGuideContext] = useState({ district: lang === "bn" ? "ঢাকা" : "Dhaka", variable: lang === "bn" ? "ভূপৃষ্ঠের তাপমাত্রা" : "Land temperature" });
  const mascotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showMascotState = useCallback((state: MascotState) => {
    if (mascotTimer.current) clearTimeout(mascotTimer.current);
    setMascotState(state);
    const duration = state === "thinking" ? 500 : state === "waving" ? 1000 : 1200;
    mascotTimer.current = setTimeout(() => setMascotState("idle"), duration);
  }, []);
  const updateGuideContext = useCallback((context: { districtId: string; district: string; variable: string; significant: boolean }) => {
    setDistrictId(context.districtId);
    setGuideContext({ district: context.district, variable: context.variable });
    if (context.significant) showMascotState("celebrating");
  }, [showMascotState]);

  useEffect(() => {
    if (!window.localStorage.getItem("mec-lang")) setLang("bn");
    showMascotState("waving");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.12 });
    document.querySelectorAll(".scroll-reveal").forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); if (mascotTimer.current) clearTimeout(mascotTimer.current); };
  }, [setLang, showMascotState]);

  return <DistrictThemeBackdrop districtId={districtId}>
    <div className="kids-page mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12">
      <DistrictLearning onMascotState={showMascotState} onContextChange={updateGuideContext} />
      <KidsMascot state={mascotState} context={guideContext} districtId={districtId} />
      <section className="knowledge-section scroll-reveal" aria-labelledby="knowledge-title"><header><p className="learn-section-label">{lang === "bn" ? "ধারণা যাচাই" : "Concept review"}</p><h2 id="knowledge-title">{lang === "bn" ? "প্রমাণ থেকে শেখা" : "Learning from evidence"}</h2><p>{lang === "bn" ? "পরিবেশের পরিবর্তন বুঝতে কয়েকটি সংক্ষিপ্ত প্রশ্ন—কোনো পয়েন্ট বা পুরস্কার নয়।" : "A few short questions for connecting environmental ideas—without points or rewards."}</p></header><KnowledgeCheck onMascotState={showMascotState} /></section>
    </div>
  </DistrictThemeBackdrop>;
}