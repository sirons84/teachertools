import { getOpenAI } from "@/lib/openai";

function extractJSON(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) return block[1].trim();
  const raw = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (raw) return raw[1];
  return text;
}

export async function callClaude(opts: {
  system: string;
  user: string;
  responseFormat?: "text" | "json";
  maxTokens?: number;
}): Promise<string> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: opts.maxTokens ?? 4096,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: 0.7,
  });
  const text = res.choices[0]?.message?.content ?? "";
  return opts.responseFormat === "json" ? extractJSON(text) : text;
}

export async function callClaudeWithHistory(opts: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}): Promise<string> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: opts.maxTokens ?? 2048,
    messages: [
      { role: "system", content: opts.system },
      ...opts.messages,
    ],
    temperature: 0.8,
  });
  return res.choices[0]?.message?.content ?? "";
}
