import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

const NAV = [
  { to: "/", key: "nav.globe" },
  { to: "/heatmap", key: "nav.heatmap" },
  { to: "/compare", key: "nav.compare" },
  { to: "/kids", key: "nav.kids" },
  { to: "/about", key: "nav.about" },
] as const;

export function SiteHeader() {
  const { t, lang, setLang } = useLang();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2 rounded-md px-1 py-1">
          <span
            aria-hidden
            className="inline-block h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold tracking-tight text-foreground">
              {t("team.name")}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">{t("app.title")}</span>
          </span>
        </Link>

        <nav aria-label="Main" className="order-3 -mx-1 w-full overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "bn" : "en")}
          aria-label={t("lang.label")}
          className="order-2 ml-auto rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:order-3"
        >
          {t("lang.toggle")}
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="mt-12 border-t border-border bg-elevated">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <p className="font-display text-sm font-semibold text-foreground">{t("team.name")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("footer.built")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("footer.license")}</p>
      </div>
    </footer>
  );
}
