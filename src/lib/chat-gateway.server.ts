import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./ai-gateway-run-id.server";

export async function streamTerraBanglaChat(request: Request, messages: UIMessage[], climateContext: string, onEnd: (messages: UIMessage[]) => Promise<void>) {
  const key = process.env['LOVABLE_API_KEY']!;
  if (!key) return new Response("Lovable AI is not configured.", { status: 401 });
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: runIdFetch.fetch });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    system: `You are TerraBangla, a careful bilingual climate learning assistant for Bangladesh. Reply in the user's language. Be warm, concise, and age-appropriate. For numerical climate claims, use only the server-computed evidence below. Never invent or calculate climate values. Clearly separate measured trends from possible explanations and never claim causation from correlation. If evidence is unavailable, say so and guide the user to choose a district or use the app's charts.\n\nSERVER-COMPUTED EVIDENCE:\n${climateContext}`,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const response = result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: true, onEnd: async ({ messages: completed, isAborted }) => { if (!isAborted) await onEnd(completed); } });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}