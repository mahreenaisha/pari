import { SarvamAIError, type SarvamAI } from "sarvamai";
import type { Env } from "../config/env.js";
import { getSarvamClient, mapSarvamError, SARVAM_REQUEST_OPTIONS } from "../sarvam/client.js";
import type { ChatMessage, ChatModel } from "./chat.js";

export class SarvamChatModel implements ChatModel {
  private jsonModeSupported = true;

  constructor(private readonly env: Env) {}

  async complete(messages: ChatMessage[], opts: { json?: boolean; maxTokens?: number } = {}): Promise<string> {
    const client = getSarvamClient(this.env.SARVAM_API_KEY);
    const request: SarvamAI.ChatCompletionsRequest = {
      model: this.env.SARVAM_CHAT_MODEL as SarvamAI.SarvamModelIds,
      messages: messages as SarvamAI.ChatCompletionRequestMessage[],
      temperature: 0.1,
      max_tokens: opts.maxTokens ?? 512,
      ...(this.env.SARVAM_REASONING_EFFORT ? { reasoning_effort: this.env.SARVAM_REASONING_EFFORT } : {}),
    };
    const wantJson = opts.json && this.jsonModeSupported;
    try {
      const response = await client.chat.completions(
        wantJson ? { ...request, response_format: { type: "json_object" } } : request,
        SARVAM_REQUEST_OPTIONS,
      );
      if (!("choices" in response)) throw new Error("Unexpected streaming response");
      return response.choices[0]?.message.content ?? "";
    } catch (err) {
      if (wantJson && err instanceof SarvamAIError && err.statusCode === 400) {
        this.jsonModeSupported = false;
        return this.complete(messages, opts);
      }
      throw mapSarvamError(err, "chat");
    }
  }
}
