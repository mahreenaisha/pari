import { pino, type Logger } from "pino";

export function createLogger(level = process.env.LOG_LEVEL ?? "info"): Logger {
  const pretty = process.stdout.isTTY && process.env.NODE_ENV !== "production" && level !== "silent";
  return pino({
    name: "pari",
    level,
    redact: ["req.headers['x-api-key']", "req.headers.authorization", "*.SARVAM_API_KEY", "*.PAYTM_MERCHANT_KEY"],
    ...(pretty ? { transport: { target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname" } } } : {}),
  });
}

export type { Logger };
