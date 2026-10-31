import { unlink } from "node:fs/promises";
import type { ConversationState, ConverseResponse, Line } from "../../contracts/index.js";
import { ApiError, subscribeEvents, type PariApi } from "../api.js";
import { calibrateMic, chime, hasSox, recordUntil, recordUtterance, stopRecorders, wavDurationSeconds } from "../audio.js";
import { nextKey, startKeys, stopKeys } from "../keys.js";
import { presentTurn, printTimings, say, status } from "../shared.js";
import { c, printEntriesTable, printError, printInfo } from "../ui.js";

type Queued = { kind: "prompt"; line: Line; state: ConversationState } | { kind: "announce"; line: Line };

const MAX_PTT_SECONDS = 30;

/**
 * The hands-free terminal: Pari listens all the time and every utterance goes
 * to her. Space records push-to-talk instead; E / L / Q help with testing.
 */
export async function listenCommand(api: PariApi, opts: { mute: boolean }): Promise<void> {
  if (!hasSox()) throw new Error("Pari needs sox for the mic and speaker: sudo apt install sox libsox-fmt-pulse");
  const health = await api.health();
  if (health.sarvam !== "configured") throw new Error("SARVAM_API_KEY is missing in backend/.env, so Pari cannot hear or speak.");

  const keys = startKeys(() => {
    status.clear();
    stopRecorders();
    stopKeys();
    console.log(c.dim("\n      Bye."));
    process.exit(0);
  });

  status.show("Checking the room noise, stay quiet for a second...");
  const cal = await calibrateMic();
  status.clear();
  if (cal) {
    printInfo(`mic ok  ·  room noise ${cal.noisePct.toFixed(1)}%  ·  speech threshold ${cal.thresholdPct.toFixed(1)}%`);
    if (cal.noisePct < 0.05) printInfo(c.yellow("The mic looks silent. Check that Windows lets WSL use the microphone."));
    if (cal.thresholdPct >= 25) printInfo(c.yellow("The room is loud, so Pari may miss you. Press Space to talk instead."));
  }

  const queue: Queued[] = [];
  let idleWait: AbortController | null = null;
  const stopEvents = subscribeEvents(
    api,
    (event) => {
      if (event.type === "pari.prompt") queue.push({ kind: "prompt", line: event.line, state: event.state });
      else if (event.type === "pari.announce" || event.type === "payment.received") queue.push({ kind: "announce", line: event.line });
      else return;
      idleWait?.abort();
    },
    (err) => printInfo(`(event stream: ${err.message}; retrying)`),
  );

  console.log(c.bold("\nPari is listening.") + c.dim("  Just speak. Ctrl+C to quit."));
  printInfo('Try: "Gupta ji ne 350 ka samaan liya, 200 UPI diya, 150 baaki."');
  if (keys) printInfo("Keys: Space push-to-talk  ·  E entries  ·  L customer pays the link  ·  Q a QR payment arrives\n");

  try {
    for (;;) {
      while (queue.length) {
        const item = queue.shift()!;
        console.log();
        printInfo(c.cyan(item.kind === "prompt" ? "payment came in:" : "update:"));
        await sayLine(api, item.line, opts.mute);
        if (item.kind === "prompt") await conversation(api, item.state, opts, keys);
      }

      idleWait = new AbortController();
      const first = await idleTurn(api, opts, keys, idleWait);
      idleWait = null;
      if (first && first.state !== "IDLE") await conversation(api, first.state, opts, keys);
    }
  } finally {
    status.clear();
    stopEvents();
    stopKeys();
  }
}

async function sayLine(api: PariApi, line: Line, mute: boolean): Promise<void> {
  console.log(`${c.magenta(c.bold("Pari:"))} ${line.text}`);
  await say(api, line, mute);
}

/** Waits for speech (or a key). Null when nothing came of it or an event cut in. */
async function idleTurn(api: PariApi, opts: { mute: boolean }, keys: boolean, wait: AbortController): Promise<ConverseResponse | null> {
  let key: string | null = null;
  const keyPress = keys
    ? nextKey(["space", "e", "l", "q"], wait.signal).then((k) => {
        if (k) {
          key = k;
          wait.abort();
        }
      })
    : Promise.resolve();

  status.show("Listening...  (Space to talk)");
  const clip = await recordUtterance({ signal: wait.signal, maxSeconds: 20, onSpeech: () => status.show("Hearing you...", c.cyan) });
  wait.abort();
  await keyPress;
  status.clear();

  switch (key as string | null) {
    case "space": {
      const ptt = await pushToTalk();
      return ptt ? sendClip(api, ptt, opts, { idle: true }) : null;
    }
    case "e":
      await showEntries(api);
      return null;
    case "l":
      await simulateLinkPaid(api);
      return null;
    case "q":
      await simulateQr(api);
      return null;
  }
  if (!clip) return null;
  if (wavDurationSeconds(clip) < 0.5) {
    await unlink(clip).catch(() => undefined);
    return null;
  }
  return sendClip(api, clip, opts, { idle: true });
}

/** Records from Space to Space (or Enter). Esc cancels. */
async function pushToTalk(): Promise<string | null> {
  await chime();
  status.show("● Recording...  Space to send, Esc to cancel", c.red);
  const stop = new AbortController();
  const recording = recordUntil(stop.signal, MAX_PTT_SECONDS);
  const key = await Promise.race([nextKey(["space", "return", "escape"], stop.signal), recording.then(() => "timeout")]);
  stop.abort();
  const clip = await recording;
  status.clear();
  if (key === "escape" || wavDurationSeconds(clip) < 0.3) {
    printInfo(key === "escape" ? "(cancelled)" : "(too short)");
    await unlink(clip).catch(() => undefined);
    return null;
  }
  return clip;
}

/** One answer from the merchant: listens until they stop talking, or Space for push-to-talk. */
async function answer(keys: boolean): Promise<string | null> {
  const wait = new AbortController();
  let talk = false;
  const space = keys
    ? nextKey(["space"], wait.signal).then((k) => {
        if (k) {
          talk = true;
          wait.abort();
        }
      })
    : Promise.resolve();
  status.show("Your turn...  (listening, or Space to talk)");
  const clip = await recordUtterance({ signal: wait.signal, maxSeconds: 15, onSpeech: () => status.show("Hearing you...", c.cyan) });
  wait.abort();
  await space;
  status.clear();
  return talk ? pushToTalk() : clip;
}

/** Keeps answering Pari until the flow is back at IDLE. */
async function conversation(api: PariApi, start: ConversationState, opts: { mute: boolean }, keys: boolean): Promise<void> {
  let state = start;
  let misses = 0;
  while (state !== "IDLE") {
    const clip = await answer(keys);
    if (!clip || wavDurationSeconds(clip) < 0.4) {
      if (clip) await unlink(clip).catch(() => undefined);
      if (++misses >= 3) {
        printInfo("No answer heard. The entry stays as it is.");
        return;
      }
      continue;
    }
    const turn = await sendClip(api, clip, opts, { idle: false });
    if (!turn) {
      if (++misses >= 3) return;
      continue;
    }
    misses = 0;
    state = turn.state;
  }
}

async function sendClip(api: PariApi, clip: string, opts: { mute: boolean }, ctx: { idle: boolean }): Promise<ConverseResponse | null> {
  const started = performance.now();
  try {
    status.show("Pari is thinking...", c.magenta);
    const turn = await api.converseAudio(clip, false);
    status.clear();
    const replyMs = performance.now() - started;
    if (ctx.idle && turn.state === "IDLE" && turn.reply.key === "notAnEntry") {
      printInfo(c.dim(`(not an entry, ignored: "${turn.transcript ?? ""}")`));
      return null;
    }
    console.log();
    presentTurn(turn);
    const voiceMs = await say(api, turn.reply, opts.mute);
    printTimings(turn, replyMs, voiceMs);
    return turn;
  } catch (err) {
    status.clear();
    if (err instanceof ApiError && (err.code === "NOTHING_HEARD" || err.code === "AUDIO_TOO_SHORT")) {
      if (!ctx.idle) printInfo("(nothing clear heard, say it again)");
      return null;
    }
    printError(err);
    return null;
  } finally {
    await unlink(clip).catch(() => undefined);
  }
}

async function showEntries(api: PariApi): Promise<void> {
  console.log();
  printEntriesTable((await api.entries(undefined, 10)).entries);
}

/** Pretends the customer paid the newest open entry's payment link. */
async function simulateLinkPaid(api: PariApi): Promise<void> {
  const { entries } = await api.entries("OPEN", 20);
  for (const entry of entries) {
    try {
      await api.simulateLinkPaid(entry.shortId);
      printInfo(c.cyan(`(simulated: ${entry.customer.name} paid the Paytm link)`));
      return;
    } catch (err) {
      if (!(err instanceof ApiError && err.code === "NO_LINK")) {
        printError(err);
        return;
      }
    }
  }
  printInfo("(no open entry has a payment link yet; save an entry and let Pari send one)");
}

/** Pretends a QR payment for the newest open entry's pending amount just arrived. */
async function simulateQr(api: PariApi): Promise<void> {
  const [entry] = (await api.entries("OPEN", 1)).entries;
  if (!entry) {
    printInfo("(no open entry to pay; save one first)");
    return;
  }
  await api.simulateQr(entry.pendingRupees);
  printInfo(c.cyan(`(simulated: ₹${entry.pendingRupees} arrived on the shop QR)`));
}
