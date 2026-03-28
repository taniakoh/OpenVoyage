import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");
const tracePath = path.join(nextDir, "trace");
const volatilePaths = [
  path.join(nextDir, "server"),
  path.join(nextDir, "cache", "webpack")
];

await mkdir(nextDir, { recursive: true });

// Clear generated server/cache output that can go stale on Windows and cause
// phantom "module not found" errors inside `.next`, even when node_modules is valid.
for (const target of volatilePaths) {
  try {
    await rm(target, { force: true, recursive: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      continue;
    }

    console.warn(`[prepare-next-dev] Skipped clearing ${target}:`, error);
  }
}

// Pre-create the trace file so Next can reuse it on Windows setups where
// opening a missing trace file intermittently throws EPERM.
const handle = await open(tracePath, "a");
await handle.close();
