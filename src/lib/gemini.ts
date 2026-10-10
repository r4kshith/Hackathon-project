const defaultModel = "gemini-3.8-flash";

export type GeminiPart = {
  text?: string;
  functionCall?: { name?: string; args?: unknown };
};

export type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
};

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || defaultModel;
}

export async function generateGeminiContent(input: unknown, timeoutMs = 25_000): Promise<GeminiResponse> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("Gemini is not configured. Add GEMINI_API_KEY to the server environment.");

  const model = getGeminiModel();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    console.error(JSON.stringify({ level: "error", event: "gemini_request_failed", status: response.status, model }));
    throw new Error("Gemini is temporarily unavailable. Check the API key and model configuration.");
  }

  return response.json() as Promise<GeminiResponse>;
}

export function geminiResponseText(response: GeminiResponse) {
  return response.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("").trim() ?? "";
}
