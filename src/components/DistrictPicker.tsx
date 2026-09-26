import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { districts, hasData } from "@/lib/climate";
import { useLang } from "@/lib/i18n";

export function DistrictPicker() {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return districts;
    return districts.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.bn.includes(query.trim()) ||
        d.division.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <section aria-labelledby="picker-heading" className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="picker-heading" className="font-display text-lg font-semibold text-foreground">
          {t("globe.pick")}
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">{t("globe.search")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("globe.search")}
            className="w-44 rounded-md border border-border bg-elevated px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((d) => {
          const ready = hasData(d.id);
          return (
            <li key={d.id}>
              <Link
                to="/district/$districtId"
                params={{ districtId: d.id }}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-elevated px-2.5 py-2 text-sm text-foreground transition-colors hover:border-primary hover:bg-secondary"
              >
                <span className="min-w-0 truncate">{lang === "bn" ? d.bn : d.name}</span>
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${ready ? "bg-stable" : "bg-border"}`}
                />
                <span className="sr-only">
                  {ready ? "" : t("district.nodata")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
