import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>) => ({
    districtA: typeof search.districtA === "string" ? search.districtA : undefined,
    districtB: typeof search.districtB === "string" ? search.districtB : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Compare district trends — MEC TERRA_DETECTORS" },
      {
        name: "description",
        content:
          "Compare two Bangladesh districts, or two variables in one district, over any year range with Theil-Sen trend lines.",
      },
      { property: "og:title", content: "Compare district trends" },
      {
        property: "og:description",
        content: "Pick a year range and compare trends with per-line significance reported honestly.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{t("compare.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
