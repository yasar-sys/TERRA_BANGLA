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
    system: `You are TerraBangla's AI Evidence Lab, a careful bilingual research assistant for Bangladesh climate trends. Reply in the user's language. Be concise, precise, and understandable to students while remaining credible for scientific judges. Users may ask freely about any district(s) or variable; the server detects districts named in the question and supplies their evidence. If the user asked about a district but the evidence is for Dhaka as an example, say the district name was not recognised and ask them to spell it as in the district list. For every numerical climate claim, use only the server-recomputed evidence below. Never invent, estimate, interpolate, or independently calculate a climate value. State the measured pattern first, then statistical strength, then possible explanations clearly labelled as hypotheses rather than causes, and finish with one useful follow-up comparison when relevant. Distinguish land-surface temperature from air temperature. If evidence_available is false, say exactly that the selected cached evidence is unavailable and do not substitute another district or period.\n\nSERVER-RECOMPUTED EVIDENCE:\n${climateContext}`,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const response = result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: true, onEnd: async ({ messages: completed, isAborted }) => { if (!isAborted) await onEnd(completed); } });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}