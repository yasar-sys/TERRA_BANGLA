import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Library, ExternalLink, Youtube } from "lucide-react";

export const Route = createFileRoute("/reference")({
  head: () => ({
    meta: [
      { title: "Reference & Research — TerraBangla" },
      {
        name: "description",
        content: "Scientific references, NASA Space Apps documentation, and project video for TerraBangla.",
      },
    ],
  }),
  component: ReferencePage,
});

const RESEARCH_LINKS = [
  {
    title: "NASA POWER Project",
    description: "Prediction Of Worldwide Energy Resources - Agroclimatology Data.",
    url: "https://power.larc.nasa.gov/",
  },
  {
    title: "MODIS Land Products",
    description: "Terra and Aqua Satellite Vegetation and Temperature Indices.",
    url: "https://modis.ornl.gov/",
  },
  {
    title: "Mann-Kendall Trend Test",
    description: "Statistical method used to analyze time series data for consistently increasing or decreasing trends.",
    url: "https://vsp.pnnl.gov/help/Vsample/Design_Trend_Mann_Kendall.htm",
  },
  {
    title: "Theil–Sen Estimator",
    description: "A method for robustly fitting a line to sample points by choosing the median of the slopes of all lines through pairs of points.",
    url: "https://en.wikipedia.org/wiki/Theil%E2%80%93Sen_estimator",
  },
];

function ReferencePage() {
  const { t, lang } = useLang();

  return (
    <div className="mx-auto max-w-4xl px-3 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <Library className="h-8 w-8 text-primary" />
        <h1 className="font-display text-3xl text-foreground">{t("reference.title")}</h1>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl text-foreground">{t("reference.nasa_apps")}</h2>
        <div className="panel mt-4 p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {lang === "bn"
              ? "টেরা বাংলা (TerraBangla) নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬ (NASA Space Apps Challenge 2026) এর জন্য তৈরি করা হয়েছে। আমাদের লক্ষ্য হলো 'Be An Earth System Trend Detective!' চ্যালেঞ্জের মাধ্যমে বাংলাদেশের ৬৪টি জেলার জলবায়ু পরিবর্তনের প্রবণতা সবার কাছে সহজভাবে তুলে ধরা।"
              : "TerraBangla is a submission for the NASA Space Apps Challenge 2026. Designed for the 'Be An Earth System Trend Detective!' challenge, it transforms raw NASA Earth-observation records into an accessible, 3D evidence-based exploration of climate trends across Bangladesh."}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-accent uppercase tracking-wider">
            <span>NASA Space Apps Challenge 2026</span>
            <span className="h-1 w-1 rounded-full bg-accent/50" />
            <span>Bangladesh</span>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-foreground">{t("reference.video_preview")}</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/30">
          <AspectRatio ratio={16 / 9}>
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-elevated/50 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Youtube className="h-8 w-8" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t("reference.video_preview")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  YouTube presentation video area reserved for competition submission.
                </p>
              </div>
            </div>
          </AspectRatio>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-foreground">{t("reference.research_links")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {RESEARCH_LINKS.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group panel block p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground group-hover:text-primary">{link.title}</h3>
                <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{link.description}</p>
              <p className="mt-3 text-[10px] text-primary/70 truncate">{link.url}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
