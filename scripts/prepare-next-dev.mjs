import { mkdir, open } from "node:fs/promises";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");
const tracePath = path.join(nextDir, "trace");

await mkdir(nextDir, { recursive: true });

// Pre-create the trace file so Next can reuse it on Windows setups where
// opening a missing trace file intermittently throws EPERM.
const handle = await open(tracePath, "a");
await handle.close();
