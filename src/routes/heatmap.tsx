import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/heatmap")({
  head: () => ({
    meta: [
      { title: "Gridded NASA heatmap of Bangladesh — MEC TERRA_DETECTORS" },
      {
        name: "description",
        content:
          "Data-driven hex-bin heatmap of Bangladesh built from cached NASA temperature, vegetation and rainfall grids.",
      },
      { property: "og:title", content: "Gridded NASA heatmap of Bangladesh" },
      {
        property: "og:description",
        content: "Switch between temperature, vegetation and rainfall grids computed from cached NASA data.",
      },
    ],
  }),
  component: HeatmapPage,
});

function HeatmapPage() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{t("heatmap.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
