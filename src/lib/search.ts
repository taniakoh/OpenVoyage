import { parseIntent, type ParsedIntent } from "@/lib/intent";
import { buildScoutDefinitions, executeScout, rankScoutResults, type ScoutExecutionResult } from "@/lib/scouts";

export type SearchPipelineEvent =
  | {
      type: "status";
      stage: "starting";
      message: string;
    }
  | {
      type: "intent";
      stage: "intent_parsed";
      intent: ParsedIntent;
    }
  | {
      type: "scout";
      scoutId: string;
      scoutLabel: string;
      lane: "transport" | "social";
      url: string;
      status: "queued" | "running" | "completed" | "failed" | "log";
      message: string;
      result?: unknown;
      summary?: string;
      rawType?: string;
      rawStatus?: string;
    }
  | {
      type: "complete";
      stage: "ranking_finished";
      summary: SearchPipelineSummary;
      scouts: SearchPipelineSnapshot["scouts"];
    }
  | {
      type: "error";
      message: string;
    };

export type SearchPipelineSummary = ReturnType<typeof rankScoutResults>;

export type SearchPipelineSnapshot = {
  prompt: string;
  generatedAt: string;
  intent: ParsedIntent;
  scouts: Array<{
    id: string;
    label: string;
    lane: "transport" | "social";
    url: string;
    status: "completed" | "failed";
    summary: string;
    result: unknown;
  }>;
  summary: SearchPipelineSummary;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

const searchCache = new Map<string, { createdAt: number; snapshot: SearchPipelineSnapshot }>();

function readCachedSnapshot(prompt: string) {
  const cached = searchCache.get(prompt);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    searchCache.delete(prompt);
    return null;
  }

  return cached.snapshot;
}

function cacheSnapshot(prompt: string, snapshot: SearchPipelineSnapshot) {
  searchCache.set(prompt, {
    createdAt: Date.now(),
    snapshot
  });
}

function emitCachedSnapshot(
  snapshot: SearchPipelineSnapshot,
  onEvent?: (event: SearchPipelineEvent) => void
) {
  if (!onEvent) {
    return;
  }

  onEvent({
    type: "status",
    stage: "starting",
    message: "Replaying recent scout results."
  });
  onEvent({
    type: "intent",
    stage: "intent_parsed",
    intent: snapshot.intent
  });

  snapshot.scouts.forEach((scout) => {
    onEvent({
      type: "scout",
      scoutId: scout.id,
      scoutLabel: scout.label,
      lane: scout.lane,
      url: scout.url,
      status: scout.status,
      summary: scout.summary,
      result: scout.result,
      message: `${scout.label} ${scout.status}`
    });
  });

  onEvent({
    type: "complete",
    stage: "ranking_finished",
    summary: snapshot.summary,
    scouts: snapshot.scouts
  });
}

export async function getSearchSnapshot(
  prompt: string,
  options?: {
    forceFresh?: boolean;
    onEvent?: (event: SearchPipelineEvent) => void;
  }
): Promise<SearchPipelineSnapshot> {
  const trimmedPrompt = prompt.trim();
  const cached = !options?.forceFresh ? readCachedSnapshot(trimmedPrompt) : null;

  if (cached) {
    emitCachedSnapshot(cached, options?.onEvent);
    return cached;
  }

  options?.onEvent?.({
    type: "status",
    stage: "starting",
    message: "Initializing Phase 2 scout mesh."
  });

  const intent = await parseIntent(trimmedPrompt);

  options?.onEvent?.({
    type: "intent",
    stage: "intent_parsed",
    intent
  });

  const scouts = buildScoutDefinitions(intent);

  scouts.forEach((scout) => {
    options?.onEvent?.({
      type: "scout",
      scoutId: scout.id,
      scoutLabel: scout.label,
      lane: scout.lane,
      url: scout.url,
      status: "queued",
      message: `Queued ${scout.label} for ${scout.url}`
    });
  });

  const results = await Promise.all(
    scouts.map(async (scout) => {
      options?.onEvent?.({
        type: "scout",
        scoutId: scout.id,
        scoutLabel: scout.label,
        lane: scout.lane,
        url: scout.url,
        status: "running",
        message: `${scout.label} launched`
      });

      const result = await executeScout(scout, intent, {
        onEvent(event) {
          options?.onEvent?.({
            type: "scout",
            scoutId: scout.id,
            scoutLabel: scout.label,
            lane: scout.lane,
            url: scout.url,
            status: event.eventType === "agent_completed" ? "completed" : "log",
            rawType: event.agent.rawEventType,
            rawStatus: event.agent.rawEventStatus,
            message: event.message || `${scout.label} emitted ${event.eventType}`
          });
        }
      });

      options?.onEvent?.({
        type: "scout",
        scoutId: scout.id,
        scoutLabel: scout.label,
        lane: scout.lane,
        url: scout.url,
        status: result.status,
        result: result.resultJson,
        summary: result.summary,
        message: `${scout.label} ${result.status}`
      });

      return result;
    })
  );

  const snapshot = buildSearchSnapshot(trimmedPrompt, intent, results);
  cacheSnapshot(trimmedPrompt, snapshot);

  options?.onEvent?.({
    type: "complete",
    stage: "ranking_finished",
    summary: snapshot.summary,
    scouts: snapshot.scouts
  });

  return snapshot;
}

function buildSearchSnapshot(
  prompt: string,
  intent: ParsedIntent,
  results: ScoutExecutionResult[]
): SearchPipelineSnapshot {
  return {
    prompt,
    generatedAt: new Date().toISOString(),
    intent,
    scouts: results.map((result) => ({
      id: result.scout.id,
      label: result.scout.label,
      lane: result.scout.lane,
      url: result.scout.url,
      status: result.status,
      summary: result.summary,
      result: result.resultJson
    })),
    summary: rankScoutResults(results)
  };
}
