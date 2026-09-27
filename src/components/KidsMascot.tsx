import { useEffect } from "react";
import celebratingAsset from "@/assets/mascot/celebrating.png.asset.json";
import encouragingAsset from "@/assets/mascot/encouraging.png.asset.json";
import idleAsset from "@/assets/mascot/idle.png.asset.json";
import thinkingAsset from "@/assets/mascot/thinking.png.asset.json";
import wavingAsset from "@/assets/mascot/waving.png.asset.json";
import { useLang } from "@/lib/i18n";

export type MascotState = "idle" | "celebrating" | "encouraging" | "thinking" | "waving";

const POSES: Record<MascotState, string> = {
  idle: idleAsset.url,
  celebrating: celebratingAsset.url,
  encouraging: encouragingAsset.url,
  thinking: thinkingAsset.url,
  waving: wavingAsset.url,
};

const MESSAGES: Record<MascotState, { en: string; bn: string }> = {
  idle: { en: "Let's discover a real trend!", bn: "চলো, একটি বাস্তব প্রবণতা খুঁজি!" },
  celebrating: { en: "Brilliant work! 🎉", bn: "দারুণ হয়েছে! 🎉" },
  encouraging: { en: "Almost there—try once more!", bn: "প্রায় ঠিক, আরেকবার চেষ্টা করো!" },
  thinking: { en: "Let's look closely…", bn: "চলো, মন দিয়ে দেখি…" },
  waving: { en: "Hello, junior detective!", bn: "হ্যালো, ছোট্ট গোয়েন্দা!" },
};

export function KidsMascot({ state }: { state: MascotState }) {
  const { lang } = useLang();

  useEffect(() => {
    Object.values(POSES).forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  return (
    <aside className={`kids-mascot is-${state}`} aria-live="polite" aria-atomic="true">
      <div className="kids-mascot-bubble">{MESSAGES[state][lang]}</div>
      <div className="kids-mascot-art" key={state}>
        <img src={POSES[state]} alt="" aria-hidden="true" draggable={false} />
      </div>
    </aside>
  );
}