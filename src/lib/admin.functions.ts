import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "saminyasarsunny@gmail.com";

async function requireAdmin(context: { userId: string; claims: Record<string, unknown>; supabase: any }) {
  const email = typeof context.claims['email'] === "string" ? context.claims['email'].toLowerCase() : "";
  if (email !== ADMIN_EMAIL) throw new Error("Admin access is restricted.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const role = await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
  if (role.error) throw new Error(role.error.message);
  return supabaseAdmin;
}

export const getAdminDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const admin = await requireAdmin(context);
  const [announcements, content, uploads, conversations, chatMessages] = await Promise.all([
    admin.from("announcements").select("*").order("created_at", { ascending: false }),
    admin.from("district_content").select("*").order("created_at", { ascending: false }),
    admin.from("data_uploads").select("id,district_id,variable,source_name,source_url,created_at").order("created_at", { ascending: false }),
    admin.from("conversations").select("id,title,user_id,updated_at").order("updated_at", { ascending: false }).limit(100),
    admin.from("chat_messages").select("id,conversation_id,role,content,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [announcements, content, uploads, conversations, chatMessages]) if (result.error) throw new Error(result.error.message);
  return { announcements: announcements.data, content: content.data, uploads: uploads.data, conversations: conversations.data, chatMessages: chatMessages.data };
});

export const addAnnouncement = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ titleEn: z.string(), titleBn: z.string(), bodyEn: z.string(), bodyBn: z.string(), published: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  const result = await admin.from("announcements").insert({ title_en: data.titleEn.trim(), title_bn: data.titleBn.trim(), body_en: data.bodyEn.trim(), body_bn: data.bodyBn.trim(), published: data.published, created_by: context.userId });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

export const addDistrictContent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ districtId: z.string(), headingEn: z.string(), headingBn: z.string(), bodyEn: z.string(), bodyBn: z.string(), published: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  const result = await admin.from("district_content").insert({ district_id: data.districtId, heading_en: data.headingEn.trim(), heading_bn: data.headingBn.trim(), body_en: data.bodyEn.trim(), body_bn: data.bodyBn.trim(), published: data.published, created_by: context.userId });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});

export const addDataUpload = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ districtId: z.string(), variable: z.string(), sourceName: z.string(), sourceUrl: z.string(), payload: z.string() }).parse(input)).handler(async ({ context, data }) => {
  const admin = await requireAdmin(context);
  let payload: unknown; try { payload = JSON.parse(data.payload); } catch { throw new Error("Data must be valid JSON."); }
  const result = await admin.from("data_uploads").insert({ district_id: data.districtId, variable: data.variable, source_name: data.sourceName.trim(), source_url: data.sourceUrl.trim(), payload: payload as never, created_by: context.userId });
  if (result.error) throw new Error(result.error.message); return { ok: true };
});