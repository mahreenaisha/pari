import ora from "ora";
import type { ConverseResponse, Line } from "../contracts/index.js";
import type { PariApi } from "./api.js";
import { playStream } from "./audio.js";
import { c, printEntry, printInfo, printLink, printPari, printYou } from "./ui.js";

/** One live status line ("listening", "hearing you", ...) that printed output can push aside. */
class StatusLine {
  private spinner: ReturnType<typeof ora> | null = null;

  show(text: string, color: (s: string) => string = c.dim): void {
    if (!process.stdout.isTTY) return;
    if (this.spinner) this.spinner.text = color(text);
    else this.spinner = ora({ text: color(text), indent: 6, discardStdin: false }).start();
  }

  clear(): void {
    this.spinner?.stop();
    this.spinner = null;
  }
}
export const status = new StatusLine();

const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** Prints the turn: what was heard, Pari's reply, and the entry / link it touched. */
export function presentTurn(turn: ConverseResponse, opts: { echoTranscript?: boolean } = {}): void {
  if (opts.echoTranscript !== false && turn.transcript) printYou(turn.transcript);
  printPari(turn.reply);
  if (turn.entry) printEntry(turn.entry);
  if (turn.link) printLink(turn.link);
}

/** Streams Pari's voice for `line`. Resolves with ms until the first sound, or null if it could not play. */
export async function say(api: PariApi, line: Line, mute: boolean): Promise<number | null> {
  if (mute) return null;
  const started = performance.now();
  let firstSound: number | null = null;
  try {
    status.show("Pari is speaking...", c.magenta);
    const body = await api.ttsStream(line.speech);
    await playStream(body, () => {
      firstSound = performance.now() - started;
    });
  } catch (err) {
    status.clear();
    printInfo(`(could not voice this line: ${(err as Error).message})`);
  } finally {
    status.clear();
  }
  return firstSound;
}

export function printTimings(turn: ConverseResponse, replyMs: number, voiceMs: number | null): void {
  const t = turn.timings;
  const parts = [
    t?.sttMs !== undefined ? `hearing ${secs(t.sttMs)}` : null,
    t ? `thinking ${secs(t.thinkMs)}` : null,
    `reply on screen ${secs(replyMs)}`,
    voiceMs !== null ? `voice starts +${secs(voiceMs)}` : null,
  ].filter(Boolean);
  printInfo(c.dim(parts.join("  ·  ")));
}
