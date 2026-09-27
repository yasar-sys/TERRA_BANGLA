import { useEffect, useState } from "react";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const SPLASH_KEY = "terrabangla-splash-seen";

export function HomeSplash({ onComplete }: { onComplete: () => void }) {
  const { lang } = useLang();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY) === "1") {
      onComplete();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => finish(), reducedMotion ? 350 : 2800);
    return () => window.clearTimeout(timer);
  }, []);

  function finish() {
    sessionStorage.setItem(SPLASH_KEY, "1");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    setLeaving(true);
    window.setTimeout(onComplete, 420);
  }

  return (
    <div className={`home-splash ${leaving ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label={lang === "bn" ? "টেরাবাংলা পরিচিতি" : "TerraBangla introduction"}>
      <div className="home-splash-stars" aria-hidden />
      <div className="home-splash-orbit" aria-hidden>
        <span className="home-splash-earth"><i /><i /><Leaf /></span>
        <span className="home-splash-satellite" />
      </div>
      <div className="home-splash-copy">
        <p>{lang === "bn" ? "বাংলাদেশ জলবায়ু প্রমাণ" : "Bangladesh climate evidence"}</p>
        <h1>TerraBangla</h1>
        <span>{lang === "bn" ? "পৃথিবী থেকে জেলা—বাস্তব NASA তথ্যের পথে" : "From Earth to district, guided by real NASA data"}</span>
      </div>
      <div className="home-splash-progress" aria-hidden><i /></div>
      <Button variant="ghost" className="home-splash-skip" onClick={finish}>
        {lang === "bn" ? "এড়িয়ে যান" : "Skip"}<ArrowRight />
      </Button>
    </div>
  );
}