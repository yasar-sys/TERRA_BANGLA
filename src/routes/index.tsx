import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GlobeStage } from "@/components/GlobeStage";
import { DistrictPicker } from "@/components/DistrictPicker";
import { VARIABLE_KEYS, VARIABLE_LABEL_KEY, coveredDistrictIds, type VariableKey } from "@/lib/climate";
import { useLang } from "@/lib/i18n";

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
  const [variable, setVariable] = useState<VariableKey>("temperature");
  const covered = coveredDistrictIds().length;

  return (
    <div className="star-field">
      <section className="mx-auto max-w-7xl px-3 pt-8 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {t("hero.challenge")}
        </p>
        <h1 className="mt-2 max-w-4xl font-display text-4xl leading-tight text-foreground sm:text-6xl">
          {t("app.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {t("app.tagline")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {covered} / 64 {t("globe.districts")} · {t("hero.cta")}
        </p>
      </section>

      <section className="mx-auto mt-4 max-w-7xl px-3 sm:px-6">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("globe.pick")}>
          {VARIABLE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setVariable(key)}
              aria-pressed={variable === key}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                variable === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {t(VARIABLE_LABEL_KEY[key])}
            </button>
          ))}
        </div>

        <div className="globe-frame mt-3 h-[58vh] min-h-[340px] overflow-hidden border border-border bg-elevated">
          <GlobeStage
            variable={variable}
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
