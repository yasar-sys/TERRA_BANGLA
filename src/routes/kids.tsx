import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/kids")({
  head: () => ({
    meta: [
      { title: "Kids' Climate Game — MEC TERRA_DETECTORS" },
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
    ],
  }),
  component: KidsPage,
});

function KidsPage() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{t("kids.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
