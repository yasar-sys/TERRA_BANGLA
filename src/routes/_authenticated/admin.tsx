import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Bell, Database, FileText, MessageSquare } from "lucide-react";
import { addAnnouncement, addDataUpload, addDistrictContent, getAdminDashboard } from "@/lib/admin.functions";
import { districts, VARIABLE_KEYS } from "@/lib/climate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin workspace — TerraBangla" }, { name: "description", content: "Restricted TerraBangla content administration." },
    { property: "og:title", content: "Admin workspace — TerraBangla" }, { property: "og:description", content: "Restricted administration workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" },
  ] }), component: AdminPage,
});

function field(form: FormData, name: string) { return String(form.get(name) ?? ""); }

function AdminPage() {
  const [data, setData] = useState<any>(null); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const refresh = () => getAdminDashboard().then(setData).catch((e) => setError(e instanceof Error ? e.message : String(e)));
  useEffect(() => { void refresh(); }, []);
  async function submit(kind: "announcement" | "content" | "upload", event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    try {
      if (kind === "announcement") await addAnnouncement({ data: { titleEn: field(form,"titleEn"), titleBn: field(form,"titleBn"), bodyEn: field(form,"bodyEn"), bodyBn: field(form,"bodyBn"), published: form.get("published") === "on" } });
      if (kind === "content") await addDistrictContent({ data: { districtId: field(form,"districtId"), headingEn: field(form,"headingEn"), headingBn: field(form,"headingBn"), bodyEn: field(form,"bodyEn"), bodyBn: field(form,"bodyBn"), published: form.get("published") === "on" } });
      if (kind === "upload") await addDataUpload({ data: { districtId: field(form,"districtId"), variable: field(form,"variable"), sourceName: field(form,"sourceName"), sourceUrl: field(form,"sourceUrl"), payload: field(form,"payload") } });
      event.currentTarget.reset(); setNotice("Saved securely."); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  if (error && !data) return <div className="mx-auto min-h-[60vh] max-w-xl px-4 py-14"><section className="panel p-6"><h1 className="font-display text-2xl">Admin workspace</h1><p role="alert" className="mt-3 text-sm text-destructive">{error}</p></section></div>;
  return <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6"><h1 className="font-display text-4xl">Admin workspace</h1><p className="mt-2 text-sm text-muted-foreground">Restricted to the approved TerraBangla administrator.</p>{notice ? <p role="status" className="mt-3 text-sm text-stable">{notice}</p> : null}{error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    <Tabs defaultValue="districts" className="mt-6"><TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-4"><TabsTrigger value="districts"><FileText className="mr-2 h-4 w-4" />District content</TabsTrigger><TabsTrigger value="announcements"><Bell className="mr-2 h-4 w-4" />Announcements</TabsTrigger><TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat review</TabsTrigger><TabsTrigger value="uploads"><Database className="mr-2 h-4 w-4" />Data uploads</TabsTrigger></TabsList>
      <TabsContent value="districts"><AdminForm onSubmit={(e) => void submit("content", e)}><SelectDistrict /><Input name="headingEn" required placeholder="English heading" /><Input name="headingBn" required placeholder="বাংলা শিরোনাম" /><Textarea name="bodyEn" required placeholder="English content" /><Textarea name="bodyBn" required placeholder="বাংলা বিষয়বস্তু" /><Publish /></AdminForm><Records rows={data?.content} /></TabsContent>
      <TabsContent value="announcements"><AdminForm onSubmit={(e) => void submit("announcement", e)}><Input name="titleEn" required placeholder="English title" /><Input name="titleBn" required placeholder="বাংলা শিরোনাম" /><Textarea name="bodyEn" required placeholder="English announcement" /><Textarea name="bodyBn" required placeholder="বাংলা ঘোষণা" /><Publish /></AdminForm><Records rows={data?.announcements} /></TabsContent>
      <TabsContent value="chat"><section className="panel p-5"><h2 className="font-display text-xl">Recent saved conversations</h2><p className="mt-1 text-xs text-muted-foreground">Review recent student questions and assistant replies.</p><div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">{data?.chatMessages?.map((message: Record<string, unknown>) => <article key={String(message['id'])} className="rounded-md border border-border bg-elevated p-3"><p className="text-[10px] font-semibold uppercase text-accent">{String(message['role'])}</p><p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{String(message['content'])}</p></article>)}</div></section></TabsContent>
      <TabsContent value="uploads"><AdminForm onSubmit={(e) => void submit("upload", e)}><SelectDistrict /><select name="variable" className="h-9 rounded-md border border-input bg-background px-3 text-sm">{VARIABLE_KEYS.map((key) => <option key={key}>{key}</option>)}</select><Input name="sourceName" required placeholder="Source name" /><Input name="sourceUrl" type="url" required placeholder="https://source…" /><Textarea name="payload" required placeholder='Valid JSON, for example: {"years":[]}' className="min-h-32 font-mono" /></AdminForm><Records rows={data?.uploads} /></TabsContent>
    </Tabs></div>;
}
function AdminForm({ children, onSubmit }: { children: React.ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form onSubmit={onSubmit} className="panel my-4 grid gap-3 p-5">{children}<Button type="submit">Save</Button></form>; }
function SelectDistrict() { return <select name="districtId" className="h-9 rounded-md border border-input bg-background px-3 text-sm">{districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}</select>; }
function Publish() { return <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" />Publish now</label>; }
function Records({ rows }: { rows?: Array<Record<string, unknown>> }) { return <div className="mt-3 grid gap-2">{rows?.slice(0,20).map((row) => <div key={String(row['id'])} className="rounded-md border border-border bg-elevated p-3 text-xs text-muted-foreground">{String(row['title_en'] ?? row['heading_en'] ?? row['title'] ?? row['source_name'] ?? row['id'])}</div>)}</div>; }