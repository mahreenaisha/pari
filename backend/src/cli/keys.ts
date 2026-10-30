import { emitKeypressEvents } from "node:readline";

interface Key {
  name?: string;
  ctrl?: boolean;
}

const listeners = new Set<(key: Key) => void>();
let raw = false;

/** Raw single-key input. Ctrl+C no longer raises SIGINT in raw mode, so it calls `onQuit`. */
export function startKeys(onQuit: () => void): boolean {
  if (!process.stdin.isTTY || raw) return raw;
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("keypress", (_s: string, key: Key | undefined) => {
    if (key?.ctrl && key.name === "c") return onQuit();
    for (const listener of [...listeners]) listener(key ?? {});
  });
  raw = true;
  return true;
}

export function stopKeys(): void {
  if (!raw) return;
  process.stdin.setRawMode(false);
  process.stdin.pause();
  raw = false;
}

export function onKey(names: string[], fn: () => void): () => void {
  const listener = (key: Key) => {
    if (key.name && names.includes(key.name)) fn();
  };
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Resolves with the first of `names` pressed, or null if `signal` aborts first. */
export function nextKey(names: string[], signal?: AbortSignal): Promise<string | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(null);
    const offs = names.map((name) =>
      onKey([name], () => {
        done();
        resolve(name);
      }),
    );
    const done = () => {
      offs.forEach((off) => off());
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      done();
      resolve(null);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
