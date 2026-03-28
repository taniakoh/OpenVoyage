"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GlassPanel } from "@/components/cinematic-ui";
import { formatWorkflowSite, formatWorkflowTime } from "@/lib/workflow-format";
import type {
  ExecutionPlan,
  WorkflowAgentSnapshot,
  WorkflowEvent,
  WorkflowSummary
} from "@/lib/workflow";

type SignalStreamClientProps = {
  prompt: string;
};

type WorkflowAgentState = WorkflowAgentSnapshot & {
  history: WorkflowEvent[];
};

type WorkflowClientState = {
  status: string;
  prompt: string;
  intent: Record<string, unknown> | null;
  plan: ExecutionPlan | null;
  agents: Record<string, WorkflowAgentState>;
  events: WorkflowEvent[];
  summary: WorkflowSummary | null;
  error: string | null;
};

const initialState: WorkflowClientState = {
  status: "Connecting to workflow stream...",
  prompt: "",
  intent: null,
  plan: null,
  agents: {},
  events: [],
  summary: null,
  error: null
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function updateAgentState(
  current: WorkflowClientState,
  event: Extract<
    WorkflowEvent,
    {
      eventType: "agent_queued" | "agent_started" | "agent_progress" | "agent_completed" | "agent_failed";
    }
  >
) {
  const existing = current.agents[event.agent.agentId];

  return {
    ...current,
    agents: {
      ...current.agents,
      [event.agent.agentId]: {
        ...(existing ?? event.agent),
        ...event.agent,
        history: [...(existing?.history ?? []), event]
      }
    }
  };
}

function phaseTone(active: boolean, complete: boolean, error: boolean) {
  if (error) {
    return "border-[#ff8d7a]/35 bg-[rgba(39,18,25,0.82)] text-[#ffd6cf]";
  }

  if (complete) {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  }

  if (active) {
    return "border-cyan-300/35 bg-cyan-300/10 text-cyan-100";
  }

  return "border-white/8 bg-white/[0.03] text-slate-400";
}

function statusPill(status: WorkflowAgentSnapshot["status"]) {
  if (status === "completed") {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "failed") {
    return "border-[#ff8d7a]/35 bg-[#341720]/70 text-[#ffd6cf]";
  }

  if (status === "running") {
    return "border-cyan-300/35 bg-cyan-300/10 text-cyan-100";
  }

  return "border-white/10 bg-white/[0.05] text-slate-300";
}

function eventTone(eventType: WorkflowEvent["eventType"]) {
  if (eventType === "workflow_error" || eventType === "agent_failed") {
    return "border-[#ff8d7a]/25 bg-[#2c1720]/65";
  }

  if (eventType === "workflow_completed" || eventType === "agent_completed") {
    return "border-emerald-300/25 bg-emerald-300/10";
  }

  if (eventType === "agent_started" || eventType === "agent_progress" || eventType === "plan_created") {
    return "border-cyan-300/20 bg-cyan-300/10";
  }

  return "border-white/8 bg-white/[0.03]";
}

export function SignalStreamClient({ prompt }: SignalStreamClientProps) {
  const [state, setState] = useState<WorkflowClientState>({ ...initialState, prompt });
  const [debugOpen, setDebugOpen] = useState(true);

  useEffect(() => {
    setState({ ...initialState, prompt });

    const url = `/api/search/stream?prompt=${encodeURIComponent(prompt)}`;
    const source = new EventSource(url);

    source.onmessage = (message) => {
      const payload = JSON.parse(message.data) as WorkflowEvent;

      setState((current) => {
        const nextBase = {
          ...current,
          events: [...current.events, payload],
          prompt: current.prompt || prompt
        };

        switch (payload.eventType) {
          case "workflow_started":
            return {
              ...nextBase,
              status: payload.message,
              prompt: payload.prompt
            };
          case "intent_parsed":
            return {
              ...nextBase,
              status: payload.message,
              intent: asRecord(payload.intent)
            };
          case "plan_created":
            return {
              ...nextBase,
              status: payload.message,
              plan: payload.plan
            };
          case "agent_queued":
          case "agent_started":
          case "agent_progress":
          case "agent_completed":
          case "agent_failed":
            return {
              ...updateAgentState(nextBase, payload),
              status: payload.message,
              error: payload.eventType === "agent_failed" ? payload.message : nextBase.error
            };
          case "synthesis_started":
            return {
              ...nextBase,
              status: payload.message
            };
          case "workflow_completed":
            source.close();
            return {
              ...nextBase,
              status: payload.message,
              summary: payload.summary
            };
          case "workflow_error":
            source.close();
            return {
              ...nextBase,
              status: "Workflow failed.",
              error: payload.message
            };
          default:
            return nextBase;
        }
      });
    };

    source.onerror = () => {
      setState((current) => ({
        ...current,
        error: current.error || "The workflow stream disconnected before completion.",
        status: "Workflow stream disconnected."
      }));
      source.close();
    };

    return () => {
      source.close();
    };
  }, [prompt]);

  const agents = useMemo(() => Object.values(state.agents), [state.agents]);
  const completedAgents = agents.filter((agent) => agent.status === "completed").length;
  const activeAgents = agents.filter((agent) => agent.status === "running").length;
  const bestRoute = asRecord(state.summary?.bestRoute);
  const socialSignal = asRecord(state.summary?.socialSignal);

  const phases = [
    {
      key: "prompt",
      label: "Prompt received",
      detail: "OpenVoyage accepts the mission and starts orchestration.",
      complete: state.events.some((event) => event.eventType === "workflow_started"),
      active: !state.events.length && !state.error
    },
    {
      key: "intent",
      label: "Intent parsed",
      detail: "OpenAI converts the request into a structured trip brief.",
      complete: state.events.some((event) => event.eventType === "intent_parsed"),
      active:
        state.events.some((event) => event.eventType === "workflow_started") &&
        !state.events.some((event) => event.eventType === "intent_parsed") &&
        !state.error
    },
    {
      key: "plan",
      label: "OpenAI plan created",
      detail: "A visible execution plan is prepared before scouts launch.",
      complete: state.events.some((event) => event.eventType === "plan_created"),
      active:
        state.events.some((event) => event.eventType === "intent_parsed") &&
        !state.events.some((event) => event.eventType === "plan_created") &&
        !state.error
    },
    {
      key: "agents",
      label: "TinyFish agents running",
      detail: "Browser agents scout operator and social surfaces in parallel.",
      complete: agents.length > 0 && agents.every((agent) => agent.status === "completed"),
      active: activeAgents > 0
    },
    {
      key: "synthesis",
      label: "Route synthesized",
      detail: "Scout results are ranked into the recommended route.",
      complete: Boolean(state.summary),
      active:
        state.events.some((event) => event.eventType === "synthesis_started") && !state.summary && !state.error
    }
  ];

  const traceNodes = [
    {
      label: "OpenAI",
      status: state.plan ? "ready" : state.intent ? "active" : "idle"
    },
    {
      label: "TinyFish",
      status: activeAgents > 0 ? "active" : completedAgents > 0 ? "ready" : "idle"
    },
    {
      label: "Synthesis",
      status: state.summary ? "ready" : state.events.some((event) => event.eventType === "synthesis_started") ? "active" : "idle"
    }
  ];

  const recommendedHeadline = String(bestRoute?.headline || "Awaiting ranked route");
  const recommendedReason = String(
    bestRoute?.confidence_note ||
      bestRoute?.reason ||
      "The system will publish the strongest route once all scouts report back."
  );
  const recommendedPrice = String(bestRoute?.price || "Pending");
  const recommendedDeparture = String(bestRoute?.departure || "Pending");
  const recommendedAvailability = String(bestRoute?.availability || bestRoute?.travel_time || "Pending");
  const socialState = String(socialSignal?.sentiment || "Pending");

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <GlassPanel className="relative overflow-hidden p-8 md:col-span-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_20%)]" />
        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">Live workflow</div>
            <h2 className="mt-3 font-headline text-4xl font-light text-white md:text-5xl">
              OpenAI plan and TinyFish browser agents in one visible lane
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{state.status}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {traceNodes.map((node, index) => (
              <div
                className={`rounded-[1.4rem] border px-4 py-4 ${
                  node.status === "active"
                    ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
                    : node.status === "ready"
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                      : "border-white/10 bg-white/[0.03] text-slate-400"
                }`}
                key={node.label}
              >
                <div className="text-[9px] uppercase tracking-[0.28em]">{`0${index + 1}`}</div>
                <div className="mt-2 font-mono text-sm">{node.label}</div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.18em]">{node.status}</div>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="relative overflow-hidden p-10 md:col-span-7">
        <div className="absolute right-8 top-8 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-cyan-100">
          Workflow signal
        </div>
        <span className="block text-[9px] uppercase tracking-[0.36em] text-cyan-300/60">Recommended route</span>
        <h2 className="mt-4 max-w-lg font-headline text-5xl font-light leading-[1.02] text-white">
          {recommendedHeadline}
        </h2>

        <div className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">{recommendedReason}</div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Price</div>
            <div className="mt-2 text-lg text-cyan-100">{recommendedPrice}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Departure</div>
            <div className="mt-2 text-lg text-cyan-100">{recommendedDeparture}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Availability</div>
            <div className="mt-2 text-lg text-cyan-100">{recommendedAvailability}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Ground truth</div>
            <div className="mt-2 text-lg capitalize text-emerald-100">{socialState}</div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <p className="max-w-xl text-sm leading-relaxed text-slate-300">{state.prompt}</p>
          <Link
            className="teal-button rounded-2xl px-7 py-4 text-sm font-semibold transition-transform hover:scale-[1.02]"
            href="/discovery-report"
          >
            Review concierge brief
          </Link>
        </div>

        {state.error ? <p className="mt-5 text-sm text-rose-200">{state.error}</p> : null}
      </GlassPanel>

      <GlassPanel className="p-8 md:col-span-5">
        <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">OpenAI plan</div>
        <h3 className="mt-3 font-headline text-[2rem] font-light text-white">Execution brief</h3>
        {state.plan ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Trip summary</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{state.plan.tripSummary}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{state.plan.planningNote}</p>
            </div>
            <div className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/5 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/70">Lane strategy</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{state.plan.laneStrategy}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Ranking criteria</div>
                <div className="mt-3 space-y-2">
                  {state.plan.rankingCriteria.map((criterion) => (
                    <div className="rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2 text-sm text-slate-200" key={criterion}>
                      {criterion}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Verification strategy</div>
                <div className="mt-3 space-y-2">
                  {state.plan.verificationStrategy.map((item) => (
                    <div className="rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2 text-sm text-slate-200" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Fallback strategy</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{state.plan.fallbackStrategy}</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-white/5 p-5 text-sm leading-relaxed text-slate-300">
            Waiting for OpenAI to publish the execution plan.
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="p-8 md:col-span-5">
        <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Workflow phases</div>
        <div className="mt-6 space-y-4">
          {phases.map((phase, index) => (
            <div className={`rounded-[1.5rem] border p-5 ${phaseTone(phase.active, phase.complete, Boolean(state.error) && !phase.complete)}`} key={phase.key}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] opacity-70">{`0${index + 1}`}</div>
                  <h3 className="mt-2 font-headline text-2xl text-white">{phase.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{phase.detail}</p>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.2em]">
                  {phase.complete ? "complete" : phase.active ? "active" : state.error ? "blocked" : "queued"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      <div className="grid gap-6 md:col-span-7 md:grid-cols-1 xl:grid-cols-1">
        {state.plan ? (
          <GlassPanel className="p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Agent launch order</div>
                <h3 className="mt-3 font-headline text-[2rem] font-light text-white">TinyFish browser lanes</h3>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{completedAgents}/{state.plan.steps.length} complete</div>
            </div>
            <div className="mt-6 grid gap-4">
              {state.plan.steps.map((step, index) => {
                const agent = state.agents[step.id];
                const latestEvent = agent?.history.at(-1);

                return (
                  <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.04] p-6" key={step.id}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">{`0${index + 1}`}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{step.lane} lane</span>
                        </div>
                        <h3 className="mt-4 font-headline text-3xl text-white">{step.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.purpose}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Target site</div>
                            <div className="mt-2 text-sm text-white">{step.site}</div>
                          </div>
                          <div className="rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3">
                            <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Success signal</div>
                            <div className="mt-2 text-sm text-white">{step.successSignal}</div>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-[240px] max-w-sm">
                        <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${statusPill(agent?.status || "queued")}`}>
                          {agent?.status || "queued"}
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-slate-300">
                          {agent?.summary || latestEvent?.message || "Waiting for the browser agent to emit progress."}
                        </p>
                        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3 text-xs text-slate-300">
                          <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">URL</div>
                          <div className="mt-2 break-all">{agent?.url || step.site}</div>
                        </div>
                        {agent?.result && typeof agent.result === "object" ? (
                          <div className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-3 font-mono text-xs text-slate-200">
                            {Object.entries(agent.result as Record<string, unknown>).slice(0, 4).map(([key, value]) => (
                              <div className="flex justify-between gap-4 py-1" key={key}>
                                <span className="uppercase tracking-[0.16em] text-slate-500">{key}</span>
                                <span className="text-right">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        ) : null}
      </div>

      <GlassPanel className="p-8 md:col-span-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Raw debug stream</div>
            <h3 className="mt-3 font-headline text-[2rem] font-light text-white">Normalized workflow events</h3>
          </div>
          <button
            className="ghost-button rounded-full px-4 py-3 text-[10px] uppercase tracking-[0.24em] text-cyan-300"
            onClick={() => setDebugOpen((current) => !current)}
            type="button"
          >
            {debugOpen ? "Collapse debug console" : "Expand debug console"}
          </button>
        </div>

        {debugOpen ? (
          <div className="mt-6 grid gap-4">
            {state.events.length ? (
              state.events.map((event) => (
                <div className={`rounded-[1.5rem] border p-5 ${eventTone(event.eventType)}`} key={event.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">
                          {event.eventType}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">{formatWorkflowTime(event.timestamp)}</span>
                        {"agent" in event ? (
                          <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                            {event.agent.agentLabel} via {formatWorkflowSite(event.agent.url)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-200">{event.message}</p>
                    </div>
                  </div>

                  {"agent" in event ? (
                    <div className="mt-4 rounded-xl border border-white/5 bg-[#08101d] px-4 py-4 font-mono text-xs text-slate-300">
                      <div>{`status=${event.agent.status}`}</div>
                      {event.agent.rawEventType ? <div>{`rawType=${event.agent.rawEventType}`}</div> : null}
                      {event.agent.rawEventStatus ? <div>{`rawStatus=${event.agent.rawEventStatus}`}</div> : null}
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-400">
                        {JSON.stringify(event.agent.rawPayload ?? event.agent.result ?? event.agent, null, 2)}
                      </pre>
                    </div>
                  ) : "plan" in event ? (
                    <div className="mt-4 rounded-xl border border-white/5 bg-[#08101d] px-4 py-4 font-mono text-xs text-slate-300">
                      <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-400">
                        {JSON.stringify(event.plan, null, 2)}
                      </pre>
                    </div>
                  ) : "summary" in event ? (
                    <div className="mt-4 rounded-xl border border-white/5 bg-[#08101d] px-4 py-4 font-mono text-xs text-slate-300">
                      <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-400">
                        {JSON.stringify(event.summary, null, 2)}
                      </pre>
                    </div>
                  ) : "intent" in event ? (
                    <div className="mt-4 rounded-xl border border-white/5 bg-[#08101d] px-4 py-4 font-mono text-xs text-slate-300">
                      <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-400">
                        {JSON.stringify(event.intent, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 text-sm text-slate-300">
                Waiting for the workflow event stream to start.
              </div>
            )}
          </div>
        ) : null}
      </GlassPanel>
    </section>
  );
}
