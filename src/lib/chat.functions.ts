import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idSchema = z.object({ conversationId: z.string().uuid() });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("conversations").select("id,title,created_at,updated_at").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ title: z.string().optional() }).parse(input))
  .handler(async ({ context, data }) => {
    const title = data.title?.trim().slice(0, 80) || "New climate question";
    const result = await context.supabase.from("conversations").insert({ user_id: context.userId, title }).select("id").single();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });

export const loadConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    const thread = await context.supabase.from("conversations").select("id,title").eq("id", data.conversationId).eq("user_id", context.userId).maybeSingle();
    if (thread.error) throw new Error(thread.error.message);
    if (!thread.data) throw new Error("Conversation not found.");
    const messages = await context.supabase.from("chat_messages").select("id,role,content").eq("conversation_id", data.conversationId).order("created_at");
    if (messages.error) throw new Error(messages.error.message);
    return { ...thread.data, messages: messages.data.map((message) => ({ id: message.id, role: message.role as "user" | "assistant", parts: [{ type: "text" as const, text: message.content }] })) };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversations").delete().eq("id", data.conversationId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });