import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  ApiErrorBody,
  CollectResponse,
  ConverseResponse,
  EntryDto,
  EntryStatusDto,
  Language,
  MatchResponse,
  PariEventDto,
  SttResponse,
  SuggestionDto,
  VoiceEntryResponse,
} from "../contracts/index.js";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const MIME: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".webm": "audio/webm",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
};

async function audioForm(file: string, fields: Record<string, string> = {}): Promise<FormData> {
  const data = await readFile(file);
  const form = new FormData();
  const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  form.append("audio", new Blob([data], { type }), path.basename(file));
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return form;
}

/** Thin typed client for the Pari API. No business logic lives here. */
export class PariApi {
  constructor(
    readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private async request<T>(method: string, route: string, body?: unknown, raw = false): Promise<T> {
    const headers: Record<string, string> = { "x-api-key": this.apiKey };
    let payload: BodyInit | undefined;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${route}`, { method, headers, body: payload ?? null });
    } catch (err) {
      throw new ApiError(0, "API_UNREACHABLE", `Cannot reach the Pari API at ${this.baseUrl}. Is "npm run dev" running? (${(err as Error).message})`);
    }
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
      throw new ApiError(res.status, err?.error.code ?? "HTTP_ERROR", err?.error.message ?? `${res.status} ${res.statusText}`);
    }
    if (raw) return Buffer.from(await res.arrayBuffer()) as T;
    return (await res.json()) as T;
  }

  health() {
    return this.request<{ ok: boolean; db: string; paytm: string; sarvam: string }>("GET", "/health");
  }

  converseText(text: string, speak: boolean) {
    return this.request<ConverseResponse>("POST", "/api/converse", { text, speak });
  }

  async converseAudio(file: string, speak: boolean) {
    return this.request<ConverseResponse>("POST", "/api/converse", await audioForm(file, { speak: String(speak) }));
  }

  state() {
    return this.request<{ sessionId: string; state: string; entryId: string | null }>("GET", "/api/converse/state");
  }

  reset() {
    return this.request<{ sessionId: string; state: string }>("POST", "/api/converse/reset");
  }

  async stt(file: string) {
    return this.request<SttResponse>("POST", "/api/stt", await audioForm(file));
  }

  tts(text: string, language?: Language) {
    return this.request<Buffer>("POST", "/api/tts", { text, language }, true);
  }

  /** WAV bytes as Bulbul produces them. */
  async ttsStream(text: string, language: Language): Promise<ReadableStream<Uint8Array>> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/tts/stream?${new URLSearchParams({ text, language })}`, { headers: { "x-api-key": this.apiKey } });
    } catch (err) {
      throw new ApiError(0, "API_UNREACHABLE", `Cannot reach the Pari API at ${this.baseUrl} (${(err as Error).message})`);
    }
    if (!res.ok || !res.body) {
      const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
      throw new ApiError(res.status, err?.error.code ?? "HTTP_ERROR", err?.error.message ?? `${res.status} ${res.statusText}`);
    }
    return res.body;
  }

  voiceEntryText(text: string, speak: boolean) {
    return this.request<VoiceEntryResponse>("POST", "/api/voice/entry", { text, speak });
  }

  async voiceEntryAudio(file: string, speak: boolean) {
    return this.request<VoiceEntryResponse>("POST", "/api/voice/entry", await audioForm(file, { speak: String(speak) }));
  }

  confirm(entryId: string, answer: "yes" | "no") {
    return this.request<{ entry: EntryDto }>("POST", `/api/entries/${entryId}/confirm`, { answer });
  }

  async confirmAudio(entryId: string, file: string) {
    return this.request<{ entry: EntryDto; answer: string; transcript?: string }>(
      "POST",
      `/api/entries/${entryId}/confirm`,
      await audioForm(file),
    );
  }

  patchEntry(entryId: string, body: { customerName?: string; totalRupees?: number; paidRupees?: number; pendingRupees?: number }) {
    return this.request<{ entry: EntryDto }>("PATCH", `/api/entries/${entryId}`, body);
  }

  entries(status?: EntryStatusDto, limit = 50) {
    const qs = new URLSearchParams({ limit: String(limit), ...(status ? { status } : {}) });
    return this.request<{ entries: EntryDto[] }>("GET", `/api/entries?${qs}`);
  }

  entry(id: string) {
    return this.request<{ entry: EntryDto }>("GET", `/api/entries/${id}`);
  }

  collect(entryId: string, phone?: string) {
    return this.request<CollectResponse>("POST", `/api/entries/${entryId}/collect`, phone ? { phone } : {});
  }

  suggestions() {
    return this.request<{ suggestions: SuggestionDto[] }>("GET", "/api/payments/suggestions");
  }

  match(paymentId: string, entryId: string) {
    return this.request<MatchResponse>("POST", `/api/payments/${paymentId}/match`, { entryId });
  }

  rejectPayment(paymentId: string) {
    return this.request<MatchResponse>("POST", `/api/payments/${paymentId}/match`, { reject: true });
  }

  simulateLinkPaid(entryId: string, amountRupees?: number) {
    return this.request<{ outcome: { status: string }; entry: EntryDto }>("POST", "/api/dev/simulate/link-paid", {
      entryId,
      ...(amountRupees !== undefined ? { amountRupees } : {}),
    });
  }

  simulateQr(amountRupees: number, payerName?: string) {
    return this.request<{ suggestion: SuggestionDto }>("POST", "/api/dev/simulate/qr", {
      amountRupees,
      ...(payerName ? { payerName } : {}),
    });
  }

  /** Reads the SSE stream until it ends or `signal` aborts. */
  async streamEvents(onEvent: (event: PariEventDto | { type: "ready" }) => void, signal: AbortSignal): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/events`, { headers: { "x-api-key": this.apiKey }, signal });
    if (!res.ok || !res.body) throw new ApiError(res.status, "SSE_FAILED", `Event stream failed: ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let split: number;
      while ((split = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);
        const name = block.match(/^event: (.+)$/m)?.[1];
        const data = block.match(/^data: (.+)$/m)?.[1];
        if (!name || !data) continue;
        if (name === "pari.ready") onEvent({ type: "ready" });
        else onEvent(JSON.parse(data) as PariEventDto);
      }
    }
  }
}

/** Keeps an SSE subscription alive across server restarts. Returns a stop function. */
export function subscribeEvents(api: PariApi, onEvent: (event: PariEventDto) => void, onError?: (err: Error) => void): () => void {
  const controller = new AbortController();
  void (async () => {
    while (!controller.signal.aborted) {
      try {
        await api.streamEvents((e) => {
          if (e.type !== "ready") onEvent(e);
        }, controller.signal);
      } catch (err) {
        if (controller.signal.aborted) return;
        onError?.(err as Error);
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  })();
  return () => controller.abort();
}
