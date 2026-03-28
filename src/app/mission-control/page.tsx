import { MissionControlClient } from "@/components/mission-control-client";
import { buildLiveSentrySnapshot } from "@/lib/live-sentry";

export default function MissionControlPage() {
  return <MissionControlClient initialSnapshot={buildLiveSentrySnapshot()} />;
}
