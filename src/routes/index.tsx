import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlobeStage } from "@/components/GlobeStage";
import { DistrictPicker } from "@/components/DistrictPicker";
import { HomeSplash } from "@/components/HomeSplash";
import { coveredDistrictIds } from "@/lib/climate";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TerraBangla — Bangladesh Climate Trend Explorer" },
      {
        name: "description",
        content:
          "Spin a 3D Earth, fly into Bangladesh and inspect real NASA vegetation, temperature, solar and rainfall trends for all 64 districts.",
      },
      { property: "og:title", content: "TerraBangla — Bangladesh Climate Trend Explorer" },
      {
        property: "og:description",
        content:
          "Mann-Kendall and Theil-Sen trend tests on cached NASA POWER and MODIS records, district by district.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"world" | "bangladesh">("world");
  const [splashReady, setSplashReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const covered = coveredDistrictIds().length;

  useEffect(() => {
    setShowSplash(sessionStorage.getItem("terrabangla-splash-seen") !== "1");
    setSplashReady(true);
  }, []);

  return (
    <div className="star-field">
      {splashReady && showSplash ? <HomeSplash onComplete={() => setShowSplash(false)} /> : null}
      <section className="mx-auto max-w-7xl px-3 pt-8 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {t("hero.challenge")}
        </p>
        <h1 className="mt-3 max-w-5xl font-display text-5xl font-bold leading-[0.98] text-foreground sm:text-7xl lg:text-8xl">
          {t("app.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {t("app.tagline")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {covered} / 64 {t("globe.districts")} · {t("hero.cta")}
        </p>
        <Button className="cta-pulse mt-5 rounded-full px-6" onClick={() => setPhase("bangladesh")}>{lang === "bn" ? "অনুসন্ধান শুরু করুন" : "Start investigating"}</Button>
      </section>

      <section className="mx-auto mt-4 max-w-7xl px-3 sm:px-6">
        <div className="globe-frame mt-3 h-[58vh] min-h-[340px] overflow-hidden border border-border bg-elevated">
          <GlobeStage
            variable="temperature"
            phase={phase}
            onPhaseChange={setPhase}
            onSelectDistrict={(districtId) =>
              navigate({ to: "/district/$districtId", params: { districtId } })
            }
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {lang === "bn"
            ? "গ্লোব মাউস বা টাচ দিয়ে ঘোরানো যায়; কীবোর্ড ব্যবহারকারীরা নিচের তালিকা থেকে জেলা বেছে নিতে পারেন।"
            : "The globe is mouse and touch driven; keyboard users can select any district from the list below."}
        </p>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-3 pb-4 sm:px-6">
        <DistrictPicker />
      </section>
    </div>
  );
}
