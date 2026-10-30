import { SarvamAIClient, SarvamAIError, SarvamAITimeoutError } from "sarvamai";
import { AppError } from "../helpers/errors.js";

export const SARVAM_REQUEST_OPTIONS = { timeoutInSeconds: 25, maxRetries: 1 } as const;

let shared: { key: string; client: SarvamAIClient } | null = null;

export function getSarvamClient(apiKey: string | undefined): SarvamAIClient {
  if (!apiKey) {
    throw new AppError(503, "SARVAM_NOT_CONFIGURED", "SARVAM_API_KEY is not set. Add it to backend/.env and restart.");
  }
  if (!shared || shared.key !== apiKey) shared = { key: apiKey, client: new SarvamAIClient({ apiSubscriptionKey: apiKey }) };
  return shared.client;
}

export function mapSarvamError(err: unknown, what: string): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof SarvamAITimeoutError) {
    return new AppError(504, "SARVAM_TIMEOUT", `Sarvam ${what} timed out. Try again.`);
  }
  if (err instanceof SarvamAIError) {
    switch (err.statusCode) {
      case 402:
        return new AppError(402, "SARVAM_CREDITS_EXHAUSTED", "Sarvam credits exhausted. Top up at https://indus.sarvam.ai and retry.");
      case 401:
      case 403:
        return new AppError(502, "SARVAM_AUTH", "Sarvam rejected the API key. Check SARVAM_API_KEY in backend/.env.");
      case 429:
        return new AppError(429, "SARVAM_RATE_LIMITED", "Sarvam rate limit hit. Wait a few seconds and retry.");
      case 400:
      case 422:
        return new AppError(502, "SARVAM_BAD_REQUEST", `Sarvam ${what} rejected the request: ${err.message}`);
      default:
        return new AppError(502, "SARVAM_ERROR", `Sarvam ${what} failed (${err.statusCode ?? "network"}): ${err.message}`);
    }
  }
  return new AppError(502, "SARVAM_ERROR", `Sarvam ${what} failed: ${(err as Error)?.message ?? String(err)}`);
}
