import { useEffect, useRef, useState } from "react";
import type { Provenance } from "@/lib/climate";
import { useLang } from "@/lib/i18n";

export function ProvenanceButton({
  provenance,
  payload,
  title,
}: {
  provenance: Provenance;
  payload: unknown;
  title: string;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {t("prov.open")}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("prov.title")}
          className="fixed inset-0 z-50 flex justify-end bg-background/70"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-4 shadow-panel sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t("prov.title")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{title}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary"
              >
                {t("prov.close")}
              </button>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("prov.dataset")} value={provenance.dataset_id} />
              <Row label={t("prov.retrieved")} value={provenance.retrieved} />
              <Row label={t("prov.mode")} value={provenance.mode} />
            </dl>
            {(() => {
              const link = resolveSourceLink(provenance.source_url);
              return (
                <div className="mt-2 space-y-1">
                  <p className="break-all text-xs text-muted-foreground">
                    {link.href ? (
                      <a
                        className="text-primary underline"
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.href}
                      </a>
                    ) : (
                      provenance.source_url
                    )}
                  </p>
                  {link.query ? (
                    <p className="break-all text-[11px] text-muted-foreground">{link.query}</p>
                  ) : null}
                </div>
              );
            })()}


            <h3 className="mt-5 text-sm font-semibold text-foreground">{t("prov.raw")}</h3>
            <pre className="mt-2 max-h-[50vh] overflow-auto rounded-lg border border-border bg-elevated p-3 text-[11px] leading-relaxed text-foreground">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
