import type { ParsedIntent } from "@/lib/intent";
import {
  getTinyFishResultPayload,
  runTinyFishAutomation,
  tinyFishEnabled,
  type TinyFishRunResult,
  type TinyFishStreamEvent
} from "@/lib/tinyfish";
import type { WorkflowAgentSnapshot, WorkflowEventType } from "@/lib/workflow";

export type ScoutDefinition = {
  id: string;
  label: string;
  lane: "transport" | "social";
  url: string;
  goal: string;
};

export type ScoutExecutionResult = {
  scout: ScoutDefinition;
  status: "completed" | "failed";
  resultJson: unknown;
  summary: string;
  rawEvents: TinyFishStreamEvent[];
};

export type ScoutProgressEvent = {
  eventType: Extract<WorkflowEventType, "agent_started" | "agent_progress" | "agent_completed" | "agent_failed">;
  agent: WorkflowAgentSnapshot;
  message: string;
};

function normaliseMode(mode?: string) {
  const value = mode?.trim().toLowerCase();
  return value || "ferry";
}

function buildTransportGoal(intent: ParsedIntent, scoutName: string, mode: string) {
  const constraints = intent.constraints.length ? intent.constraints.join(", ") : "no extra constraints";
  return [
    `Scout ${scoutName} for the best ${mode} option from ${intent.origin} to ${intent.destination}.`,
    `Prioritize these constraints: ${constraints}.`,
    "Return JSON in this exact shape:",
    '{"headline": string, "price": string, "departure": string, "travel_time": string, "booking_url": string, "confidence_note": string}'
  ].join(" ");
}

function buildSocialGoal(intent: ParsedIntent) {
  const query = intent.scout_queries[0] || `${intent.origin} ${intent.destination} delays`;
  return [
    `Search for ground-truth traveler chatter related to ${intent.origin}, ${intent.destination}, and this task: ${query}.`,
    "Focus on delays, queues, outages, or reassurance signals from community sources.",
    "Return JSON in this exact shape:",
    '{"headline": string, "sentiment": "stable" | "mixed" | "risky", "evidence": [string], "recommended_window": string}'
  ].join(" ");
}

export function buildScoutDefinitions(intent: ParsedIntent): ScoutDefinition[] {
  const primaryMode = normaliseMode(intent.preferred_modes[0]);
  const secondaryMode = normaliseMode(intent.preferred_modes[1] || intent.preferred_modes[0]);
  const destinationSlug = encodeURIComponent(intent.destination);
  const originSlug = encodeURIComponent(intent.origin);

  return [
    {
      id: "transport-a",
      label: "Transport A",
      lane: "transport",
      url:
        primaryMode === "ferry"
          ? "https://www.batamfast.com"
          : `https://www.google.com/travel/flights?hl=en#flt=${originSlug}.${destinationSlug}`,
      goal: buildTransportGoal(intent, "Transport A", primaryMode)
    },
    {
      id: "transport-b",
      label: "Transport B",
      lane: "transport",
      url:
        secondaryMode === "train"
          ? "https://shuttleonline.ktmb.com.my/Home/Shuttle"
          : "https://www.directferries.com",
      goal: buildTransportGoal(intent, "Transport B", secondaryMode)
    },
    {
      id: "social-scout",
      label: "Social Scout",
      lane: "social",
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(`${intent.origin} ${intent.destination} delays`)}`,
      goal: buildSocialGoal(intent)
    }
  ];
}

function createMockScoutResult(scout: ScoutDefinition, intent: ParsedIntent): ScoutExecutionResult {
  if (scout.id === "social-scout") {
    return {
      scout,
      status: "completed",
      resultJson: {
        headline: `${intent.destination} sentiment window looks stable`,
        sentiment: "stable",
        evidence: [
          "Reddit queue reports stay calm before 07:00.",
          "No major disruption signals in the latest community chatter."
        ],
        recommended_window: "Depart before 07:00 SGT"
      },
      summary: "Ground-truth chatter is calm with a clear early departure window.",
      rawEvents: [
        { type: "STARTED", message: "Mock social scan launched" },
        { type: "COMPLETE", status: "COMPLETED" }
      ]
    };
  }

  return {
    scout,
    status: "completed",
    resultJson: {
      headline: `${intent.destination} ${scout.label} shortlist`,
      price: scout.id === "transport-a" ? "SGD 52" : "SGD 58",
      departure: scout.id === "transport-a" ? "06:40 SGT" : "07:20 SGT",
      travel_time: scout.id === "transport-a" ? "1h 10m" : "1h 25m",
      booking_url: scout.url,
      confidence_note:
        scout.id === "transport-a"
          ? "Best balance of quiet departure and affordable fare."
          : "Slightly slower but still within the preferred calm window."
    },
    summary:
      scout.id === "transport-a"
        ? "Primary transport lane found the strongest quiet-window option."
        : "Secondary transport lane produced a viable fallback.",
    rawEvents: [
      { type: "STARTED", message: "Mock transport scan launched" },
      { type: "COMPLETE", status: "COMPLETED" }
    ]
  };
}

function getScoutTimeoutMs() {
  const parsed = Number(process.env.OPENVOYAGE_SCOUT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20_000;
}

export async function executeScout(
  scout: ScoutDefinition,
  intent: ParsedIntent,
  options?: {
    onEvent?: (event: ScoutProgressEvent) => void;
    signal?: AbortSignal;
  }
): Promise<ScoutExecutionResult> {
  if (!tinyFishEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 550));
    const mockResult = createMockScoutResult(scout, intent);
    mockResult.rawEvents.forEach((event) => {
      options?.onEvent?.(toScoutProgressEvent(scout, event));
    });
    return mockResult;
  }

  const timeoutController = new AbortController();
  const parentAbortHandler = () => timeoutController.abort(options?.signal?.reason);
  options?.signal?.addEventListener("abort", parentAbortHandler, { once: true });

  try {
    const run: TinyFishRunResult = await Promise.race([
      runTinyFishAutomation(
        {
          url: scout.url,
          goal: scout.goal
        },
        {
          signal: timeoutController.signal,
          onEvent(event) {
            options?.onEvent?.(toScoutProgressEvent(scout, event));
          }
        }
      ),
      new Promise<TinyFishRunResult>((_, reject) => {
        const timeoutId = setTimeout(() => {
          timeoutController.abort();
          reject(new Error(`Scout timed out after ${getScoutTimeoutMs()}ms.`));
        }, getScoutTimeoutMs());

        timeoutController.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timeoutId);
          },
          { once: true }
        );
      })
    ]);

    const payload = getTinyFishResultPayload(run.finalEvent);

    return {
      scout,
      status: run.finalEvent.status === "COMPLETED" ? "completed" : "failed",
      resultJson: payload,
      summary:
        typeof payload === "object" && payload !== null
          ? "Structured scout payload received."
          : "Scout completed without a structured object payload.",
      rawEvents: run.events
    };
  } catch (error) {
    const mockResult = createMockScoutResult(scout, intent);
    return {
      ...mockResult,
      summary:
        error instanceof Error
          ? `${mockResult.summary} TinyFish fallback used: ${error.message}`
          : `${mockResult.summary} TinyFish fallback used.`
    };
  } finally {
    options?.signal?.removeEventListener("abort", parentAbortHandler);
  }
}

function toScoutProgressEvent(
  scout: ScoutDefinition,
  event: TinyFishStreamEvent
): ScoutProgressEvent {
  const eventType = event.type === "STARTED" ? "agent_started" : "agent_progress";

  return {
    eventType,
    message: event.message || `${scout.label} emitted ${event.type}`,
    agent: {
      agentId: scout.id,
      agentLabel: scout.label,
      lane: scout.lane,
      url: scout.url,
      goal: scout.goal,
      status: "running",
      rawEventType: event.type,
      rawEventStatus: event.status,
      rawPayload: event
    }
  };
}

export function rankScoutResults(results: ScoutExecutionResult[]) {
  const primaryTransport = results.find((result) => result.scout.id === "transport-a");
  const fallbackTransport = results.find((result) => result.scout.id === "transport-b");
  const socialScout = results.find((result) => result.scout.id === "social-scout");

  return {
    bestRoute: primaryTransport?.resultJson ?? null,
    fallbackRoute: fallbackTransport?.resultJson ?? null,
    socialSignal: socialScout?.resultJson ?? null,
    completedScouts: results.filter((result) => result.status === "completed").length
  };
}
