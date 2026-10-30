import path from "node:path";
import type { Request } from "express";
import multer from "multer";
import type { AudioInput } from "../stt/saaras.service.js";
import { AppError } from "./errors.js";

/** Saaras accepts these directly, so no server-side conversion is needed. */
const AUDIO_EXTENSIONS = new Set([".wav", ".mp3", ".m4a", ".mp4", ".aac", ".ogg", ".oga", ".opus", ".webm", ".flac", ".amr", ".aiff"]);
const EXT_MIME: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".opus": "audio/ogg",
  ".webm": "audio/webm",
  ".flac": "audio/flac",
  ".amr": "audio/amr",
  ".aiff": "audio/aiff",
};
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok = file.mimetype.startsWith("audio/") || file.mimetype === "video/webm" || AUDIO_EXTENSIONS.has(ext);
    if (ok) cb(null, true);
    else cb(new AppError(415, "UNSUPPORTED_AUDIO", `Unsupported audio type ${file.mimetype} (${ext || "no extension"})`));
  },
}).single("audio");

export function audioFromRequest(req: Request): AudioInput | null {
  const file = req.file;
  if (!file) return null;
  if (file.size < 1000) throw new AppError(422, "AUDIO_TOO_SHORT", "Audio clip is empty or too short");
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.startsWith("audio/") ? file.mimetype.split(";")[0]! : (EXT_MIME[ext] ?? "audio/wav");
  return { data: file.buffer, filename: file.originalname || `audio${ext || ".wav"}`, mimeType };
}

/** Multipart fields arrive as strings. */
export function boolField(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "false" || value === "0") return false;
  if (value === "true" || value === "1") return true;
  return fallback;
}
