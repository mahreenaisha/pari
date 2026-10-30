#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { PariApi } from "./api.js";
import { startCommand } from "./commands/start.js";
import { printError } from "./ui.js";

for (const candidate of [path.resolve(".env"), path.resolve(import.meta.dirname, "../../.env")]) {
  if (!process.env.PARI_API_KEY && existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
}

const api = new PariApi((process.env.PARI_API_URL ?? "http://localhost:4000").replace(/\/$/, ""), process.env.PARI_API_KEY ?? "pari-dev-key");

try {
  await startCommand(api, { mute: process.argv.includes("--mute") });
} catch (err) {
  printError(err);
  process.exitCode = 1;
}
