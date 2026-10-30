import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SAMPLE_RATE = 16000;
/** Seconds of quiet that end an utterance. */
const END_SILENCE = "0.9";
const workDir = mkdtempSync(path.join(tmpdir(), "pari-"));
let clipCounter = 0;

/**
 * WSLg forwards audio to Windows over RDP; with sox's small default buffers
 * playback stutters. A bigger buffer and a native 48 kHz stereo stream keep
 * it smooth.
 */
const AUDIO_ENV = { ...process.env, AUDIODRIVER: process.env.AUDIODRIVER ?? "pulseaudio", PULSE_LATENCY_MSEC: process.env.PULSE_LATENCY_MSEC ?? "120" };
const PLAY_ARGS = ["-q", "--buffer", "32768"];
const PLAY_EFFECTS = ["rate", "48k", "channels", "2"];

export function newClipPath(ext = "wav"): string {
  clipCounter += 1;
  return path.join(workDir, `clip-${Date.now()}-${clipCounter}.${ext}`);
}

export const hasSox = () => spawnSync("sh", ["-c", "command -v rec && command -v play"], { stdio: "ignore" }).status === 0;

export function wavDurationSeconds(file: string): number {
  try {
    return Math.max(0, statSync(file).size - 44) / (SAMPLE_RATE * 2);
  } catch {
    return 0;
  }
}

function waitExit(child: ChildProcess): Promise<number | null> {
  return new Promise((resolve) => {
    child.on("exit", (code) => resolve(code));
    child.on("error", () => resolve(-1));
  });
}

const recorders = new Set<ChildProcess>();
function rec(args: string[]): ChildProcess {
  const child = spawn("rec", ["-q", "-c", "1", "-r", String(SAMPLE_RATE), "-b", "16", ...args], { stdio: "ignore", env: AUDIO_ENV });
  recorders.add(child);
  child.once("exit", () => recorders.delete(child));
  return child;
}

/** Stops every running recorder, e.g. on quit. */
export function stopRecorders(): void {
  for (const child of recorders) child.kill("SIGTERM");
}

/** Percent of full scale that counts as speech; set from the room by `calibrateMic`. */
let speechThresholdPct = 3;

/** Records a moment of room noise and puts the speech threshold well above it. */
export async function calibrateMic(seconds = 1.5): Promise<{ noisePct: number; thresholdPct: number } | null> {
  const file = newClipPath();
  await waitExit(rec([file, "trim", "0", String(seconds)]));
  const out = spawnSync("sox", [file, "-n", "stat"], { encoding: "utf8" });
  const match = /RMS\s+amplitude:\s+([\d.]+)/.exec(out.stderr ?? "");
  if (!match) return null;
  const noisePct = Number(match[1]) * 100;
  speechThresholdPct = Math.min(25, Math.max(3, noisePct * 2.5));
  return { noisePct, thresholdPct: speechThresholdPct };
}

/** Push-to-talk: records until `stop` aborts (or `maxSeconds` passes). */
export async function recordUntil(stop: AbortSignal, maxSeconds = 30): Promise<string> {
  const file = newClipPath();
  const child = rec([file, "trim", "0", String(maxSeconds)]);
  const exited = waitExit(child);
  const onStop = () => child.kill("SIGINT");
  if (stop.aborted) onStop();
  else stop.addEventListener("abort", onStop, { once: true });
  await exited;
  stop.removeEventListener("abort", onStop);
  return file;
}

/**
 * Hands-free: sox starts writing when it hears speech and stops after a short
 * silence, so only real speech is ever sent to speech-to-text.
 * Resolves null if aborted.
 */
export async function recordUtterance(
  opts: { signal?: AbortSignal; maxSeconds?: number; onSpeech?: () => void } = {},
): Promise<string | null> {
  const file = newClipPath();
  const thr = `${speechThresholdPct.toFixed(1)}%`;
  const child = rec([file, "silence", "1", "0.15", thr, "1", END_SILENCE, thr, "trim", "0", String(opts.maxSeconds ?? 15)]);
  const onAbort = () => child.kill("SIGTERM");
  opts.signal?.addEventListener("abort", onAbort, { once: true });
  const poll = opts.onSpeech
    ? setInterval(() => {
        try {
          if (statSync(file).size > 44 + SAMPLE_RATE / 5) {
            clearInterval(poll);
            opts.onSpeech!();
          }
        } catch {
          // file not created yet
        }
      }, 100)
    : undefined;
  await waitExit(child);
  clearInterval(poll);
  opts.signal?.removeEventListener("abort", onAbort);
  if (opts.signal?.aborted) return null;
  return file;
}

/** Plays a WAV byte stream as it arrives. `onStart` fires with the first bytes. */
export async function playStream(body: ReadableStream<Uint8Array>, onStart?: () => void): Promise<void> {
  const child = spawn("play", [...PLAY_ARGS, "-t", "wav", "-", ...PLAY_EFFECTS], { stdio: ["pipe", "ignore", "ignore"], env: AUDIO_ENV });
  const exited = waitExit(child);
  child.stdin!.on("error", () => undefined);
  const reader = body.getReader();
  let started = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!started) {
        started = true;
        onStart?.();
      }
      if (!child.stdin!.write(value)) await new Promise((r) => child.stdin!.once("drain", r));
    }
  } finally {
    child.stdin!.end();
  }
  await exited;
}

export async function chime(): Promise<void> {
  await waitExit(spawn("play", [...PLAY_ARGS, "-n", "synth", "0.12", "sine", "880", "vol", "0.3", ...PLAY_EFFECTS], { stdio: "ignore", env: AUDIO_ENV }));
}
