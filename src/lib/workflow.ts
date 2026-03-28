import type { ParsedIntent } from "@/lib/intent";
import type { ScoutExecutionResult } from "@/lib/scouts";

export type WorkflowEventType =
  | "workflow_started"
  | "intent_parsed"
  | "plan_created"
  | "agent_queued"
  | "agent_started"
  | "agent_progress"
  | "agent_completed"
  | "agent_failed"
  | "synthesis_started"
  | "workflow_completed"
  | "workflow_error";

export type WorkflowAgentStatus = "queued" | "running" | "completed" | "failed";

export type WorkflowAgentLane = "transport" | "social";

export type ExecutionPlanStep = {
  id: string;
  title: string;
  lane: WorkflowAgentLane;
  site: string;
  purpose: string;
  successSignal: string;
};

export type ExecutionPlan = {
  tripSummary: string;
  planningNote: string;
  laneStrategy: string;
  rankingCriteria: string[];
  verificationStrategy: string[];
  fallbackStrategy: string;
  steps: ExecutionPlanStep[];
};

export type WorkflowAgentSnapshot = {
  agentId: string;
  agentLabel: string;
  lane: WorkflowAgentLane;
  url: string;
  goal: string;
  status: WorkflowAgentStatus;
  summary?: string;
  result?: unknown;
  rawEventType?: string;
  rawEventStatus?: string;
  rawPayload?: unknown;
};

type WorkflowEventBase = {
  id: string;
  eventType: WorkflowEventType;
  timestamp: string;
};

export type WorkflowEvent =
  | (WorkflowEventBase & {
      eventType: "workflow_started";
      prompt: string;
      message: string;
    })
  | (WorkflowEventBase & {
      eventType: "intent_parsed";
      intent: ParsedIntent;
      message: string;
    })
  | (WorkflowEventBase & {
      eventType: "plan_created";
      plan: ExecutionPlan;
      message: string;
    })
  | (WorkflowEventBase & {
      eventType: "agent_queued" | "agent_started" | "agent_progress" | "agent_completed" | "agent_failed";
      message: string;
      agent: WorkflowAgentSnapshot;
    })
  | (WorkflowEventBase & {
      eventType: "synthesis_started";
      message: string;
    })
  | (WorkflowEventBase & {
      eventType: "workflow_completed";
      message: string;
      summary: WorkflowSummary;
    })
  | (WorkflowEventBase & {
      eventType: "workflow_error";
      message: string;
      stage: "intent" | "planning" | "scouting" | "synthesis" | "unknown";
    });

export type WorkflowSummary = {
  plan: ExecutionPlan;
  bestRoute: unknown;
  fallbackRoute: unknown;
  socialSignal: unknown;
  completedScouts: number;
  agentOutcomes: ScoutExecutionResult[];
};

let workflowEventCounter = 0;

export function createWorkflowEvent(
  eventType: WorkflowEvent["eventType"],
  payload: Record<string, unknown>
): WorkflowEvent {
  workflowEventCounter += 1;

  return {
    id: `workflow-${workflowEventCounter}`,
    eventType,
    timestamp: new Date().toISOString(),
    ...payload
  } as WorkflowEvent;
}

export function getWorkflowAgentStatus(eventType: WorkflowEventType): WorkflowAgentStatus | null {
  if (eventType === "agent_queued") {
    return "queued";
  }

  if (eventType === "agent_started" || eventType === "agent_progress") {
    return "running";
  }

  if (eventType === "agent_completed") {
    return "completed";
  }

  if (eventType === "agent_failed") {
    return "failed";
  }

  return null;
}
