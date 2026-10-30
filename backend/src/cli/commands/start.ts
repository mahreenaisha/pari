import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, openSync, readFileSync } from "node:fs";
import path from "node:path";
import type { PariApi } from "../api.js";
import { status } from "../shared.js";
import { c, printInfo } from "../ui.js";
import { listenCommand } from "./listen.js";

const backendDir = path.resolve(import.meta.dirname, "../../..");
const serverEntry = path.resolve(import.meta.dirname, `../../server${path.extname(import.meta.filename)}`);
const logFile = path.join(backendDir, ".data", "server.log");

async function isUp(api: PariApi): Promise<boolean> {
  return api.health().then(
    () => true,
    () => false,
  );
}

/** Starts the API in the background (logs to .data/server.log) unless one is already running. */
async function ensureServer(api: PariApi): Promise<ChildProcess | null> {
  if (await isUp(api)) {
    printInfo(`using the Pari server already running at ${api.baseUrl}`);
    return null;
  }
  mkdirSync(path.dirname(logFile), { recursive: true });
  const log = openSync(logFile, "a");
  const child = spawn(process.execPath, [...process.execArgv, serverEntry], {
    cwd: backendDir,
    env: { ...process.env, PORT: new URL(api.baseUrl).port || "4000" },
    stdio: ["ignore", log, log],
  });
  process.on("exit", () => child.kill("SIGTERM"));

  status.show("Starting Pari...");
  let exited = false;
  child.once("exit", () => (exited = true));
  for (let waited = 0; waited < 30_000 && !exited; waited += 250) {
    if (await isUp(api)) {
      status.clear();
      printInfo(`server started  ·  logs in ${path.relative(process.cwd(), logFile) || logFile}`);
      return child;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  status.clear();
  child.kill("SIGTERM");
  const tail = readFileSync(logFile, "utf8").trim().split("\n").slice(-8).join("\n");
  throw new Error(`The Pari server did not start. Last log lines:\n${c.dim(tail)}`);
}

export async function startCommand(api: PariApi, opts: { mute: boolean }): Promise<void> {
  console.log(c.bold(c.magenta("Pari")) + c.dim("  ·  voice udhar ledger"));
  const child = await ensureServer(api);
  try {
    await listenCommand(api, opts);
  } finally {
    child?.kill("SIGTERM");
  }
}
