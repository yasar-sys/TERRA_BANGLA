import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { createConversation, deleteConversation, listConversations, loadConversation } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  head: () => ({ meta: [
    { title: "Climate conversation — TerraBangla" }, { name: "description", content: "A saved TerraBangla climate conversation." },
    { property: "og:title", content: "Climate conversation — TerraBangla" }, { property: "og:description", content: "Ask questions grounded in cached Bangladesh climate evidence." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: ChatThread,
});

function ChatThread() {
  const { conversationId } = Route.useParams(); const { lang } = useLang(); const navigate = useNavigate();
  const [initial, setInitial] = useState<UIMessage[] | null>(null); const [threads, setThreads] = useState<Array<{ id: string; title: string }>>([]); const [error, setError] = useState("");
  useEffect(() => { Promise.all([loadConversation({ data: { conversationId } }), listConversations()]).then(([thread, list]) => { setInitial(thread.messages as UIMessage[]); setThreads(list); }).catch((e) => setError(e instanceof Error ? e.message : String(e))); }, [conversationId]);
  async function newThread() { const item = await createConversation({ data: {} }); await navigate({ to: "/chat/$conversationId", params: { conversationId: item.id } }); }
  async function removeThread(id: string) { await deleteConversation({ data: { conversationId: id } }); const rest = await listConversations(); if (!rest.length) return newThread(); await navigate({ to: "/chat/$conversationId", params: { conversationId: rest[0]!.id } }); }
  if (!initial) return <div className="mx-auto min-h-[60vh] max-w-5xl px-4 py-10">{error ? <p role="alert" className="text-destructive">{error}</p> : <Shimmer>{lang === "bn" ? "কথোপকথন খুলছি…" : "Opening conversation…"}</Shimmer>}</div>;
  return <div className="mx-auto grid min-h-[70vh] max-w-7xl gap-4 px-3 py-5 sm:px-6 lg:grid-cols-[250px_1fr]">
    <aside className="panel p-3"><Button className="w-full" onClick={newThread}><Plus />{lang === "bn" ? "নতুন আলোচনা" : "New conversation"}</Button><div className="mt-3 space-y-1">{threads.map((thread) => <div key={thread.id} className="flex items-center gap-1"><Link to="/chat/$conversationId" params={{ conversationId: thread.id }} className={`min-w-0 flex-1 truncate rounded-md px-3 py-2 text-sm ${thread.id === conversationId ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"}`}>{thread.title}</Link><Button size="icon-sm" variant="ghost" aria-label="Delete conversation" onClick={() => void removeThread(thread.id)}><Trash2 /></Button></div>)}</div></aside>
    <ChatPanel key={conversationId} conversationId={conversationId} initialMessages={initial} lang={lang} />
  </div>;
}

function ChatPanel({ conversationId, initialMessages, lang }: { conversationId: string; initialMessages: UIMessage[]; lang: "en" | "bn" }) {
  const inputRef = useRef<HTMLTextAreaElement>(null); const [input, setInput] = useState(""); const [errorText, setErrorText] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { conversationId }, headers: async () => { const { data } = await supabase.auth.getSession(); return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}; } }), [conversationId]);
  const { messages, sendMessage, status, stop } = useChat({ id: conversationId, messages: initialMessages, transport, onError: (error) => setErrorText(error.message), onFinish: () => { inputRef.current?.focus(); } });
  const busy = status === "submitted" || status === "streaming";
  return <section className="panel flex h-[72vh] min-h-[560px] flex-col overflow-hidden">
    <header className="border-b border-border px-5 py-4"><h1 className="font-display text-xl">{lang === "bn" ? "টেরা বাংলাকে জিজ্ঞেস করুন" : "Ask TerraBangla"}</h1><p className="text-xs text-muted-foreground">{lang === "bn" ? "সংরক্ষিত উপাত্তের ভিত্তিতে উত্তর; সম্ভাব্য কারণ আলাদা করে বলা হবে।" : "Answers use cached evidence and label possible explanations clearly."}</p></header>
    <Conversation><ConversationContent>{messages.length === 0 ? <ConversationEmptyState icon={<MessageCircle className="h-9 w-9" />} title={lang === "bn" ? "একটি জলবায়ু প্রশ্ন করুন" : "Ask a climate question"} description={lang === "bn" ? "যেমন: ঢাকার তাপমাত্রার প্রবণতা কী?" : "For example: What is Dhaka's temperature trend?"} /> : messages.map((message) => <Message from={message.role} key={message.id}><MessageContent>{message.parts.map((part, index) => part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : null)}</MessageContent></Message>)}{status === "submitted" ? <Shimmer className="text-sm">{lang === "bn" ? "উপাত্ত দেখছি…" : "Checking evidence…"}</Shimmer> : null}</ConversationContent><ConversationScrollButton /></Conversation>
    <div className="border-t border-border p-3"><PromptInput onSubmit={({ text }) => { const clean = text.trim(); if (!clean || busy) return; setErrorText(""); void sendMessage({ text: clean }); setInput(""); }}><PromptInputTextarea ref={inputRef} autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === "bn" ? "জেলা বা প্রবণতা নিয়ে প্রশ্ন করুন…" : "Ask about a district or trend…"} /><PromptInputFooter className="justify-end"><PromptInputSubmit status={status} disabled={!input.trim() && !busy} onStop={stop} /></PromptInputFooter></PromptInput>{errorText ? <p role="alert" className="mt-2 text-xs text-destructive">{errorText}</p> : null}</div>
  </section>;
}