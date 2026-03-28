"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { GlassPanel } from "@/components/cinematic-ui";

type SignalStreamClientProps = {
  prompt: string;
};

type StreamLog = {
  id: string;
  label: string;
  detail: string;
};

type ScoutCard = {
  id: string;
  label: string;
  lane: string;
  status: string;
  summary: string;
  result: Record<string, unknown> | null;
};

type StreamState = {
  status: string;
  intent: Record<string, unknown> | null;
  logs: StreamLog[];
  scouts: ScoutCard[];
  bestRoute: Record<string, unknown> | null;
  socialSignal: Record<string, unknown> | null;
  error: string | null;
};

const initialState: StreamState = {
  status: "Connecting to scout mesh...",
  intent: null,
  logs: [],
  scouts: [],
  bestRoute: null,
  socialSignal: null,
  error: null
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function SignalStreamClient({ prompt }: SignalStreamClientProps) {
  const [state, setState] = useState<StreamState>(initialState);
  const eventCounter = useRef(0);

  useEffect(() => {
    setState(initialState);

    const url = `/api/search/stream?prompt=${encodeURIComponent(prompt)}`;
    const source = new EventSource(url);

    const appendLog = (label: string, detail: string) => {
      eventCounter.current += 1;

      setState((current) => ({
        ...current,
        logs: [...current.logs, { id: `${eventCounter.current}`, label, detail }].slice(-12)
      }));
    };

    source.onmessage = (message) => {
      const payload = JSON.parse(message.data) as Record<string, unknown>;

      if (payload.type === "status") {
        const detail = typeof payload.message === "string" ? payload.message : "Scout status updated.";
        appendLog("System", detail);
        setState((current) => ({
          ...current,
          status: detail
        }));
        return;
      }

      if (payload.type === "intent") {
        appendLog("Intent Parser", "Structured travel intent generated.");
        setState((current) => ({
          ...current,
          intent: asRecord(payload.intent),
          status: "Intent parsed. Launching parallel scouts."
        }));
        return;
      }

      if (payload.type === "scout") {
        const scoutId = typeof payload.scoutId === "string" ? payload.scoutId : "unknown";
        const scoutLabel = typeof payload.scoutLabel === "string" ? payload.scoutLabel : "Scout";
        const status = typeof payload.status === "string" ? payload.status : "log";
        const detail =
          typeof payload.message === "string" ? payload.message : `${scoutLabel} reported ${status}.`;

        appendLog(scoutLabel, detail);
        setState((current) => {
          const nextScouts = [...current.scouts];
          const index = nextScouts.findIndex((entry) => entry.id === scoutId);
          const nextCard: ScoutCard = {
            id: scoutId,
            label: scoutLabel,
            lane: typeof payload.lane === "string" ? payload.lane : "transport",
            status,
            summary: typeof payload.summary === "string" ? payload.summary : detail,
            result: asRecord(payload.result)
          };

          if (index === -1) {
            nextScouts.push(nextCard);
          } else {
            nextScouts[index] = {
              ...nextScouts[index],
              ...nextCard,
              result: nextCard.result ?? nextScouts[index].result
            };
          }

          return {
            ...current,
            scouts: nextScouts,
            status:
              status === "completed"
                ? `${scoutLabel} finished.`
                : status === "running"
                  ? `${scoutLabel} is scouting.`
                  : current.status
          };
        });
        return;
      }

      if (payload.type === "complete") {
        const summary = asRecord(payload.summary);
        appendLog("Synthesizer", "Scout results merged into a ranked route summary.");
        setState((current) => ({
          ...current,
          status: "Phase 2 stream complete.",
          bestRoute: asRecord(summary?.bestRoute),
          socialSignal: asRecord(summary?.socialSignal)
        }));
        source.close();
        return;
      }

      if (payload.type === "error") {
        const detail =
          typeof payload.message === "string" ? payload.message : "The scout stream failed unexpectedly.";
        appendLog("Error", detail);
        setState((current) => ({
          ...current,
          error: detail,
          status: "Scout stream failed."
        }));
        source.close();
      }
    };

    source.onerror = () => {
      setState((current) => ({
        ...current,
        error: current.error || "The scout stream disconnected before completion."
      }));
      source.close();
    };

    return () => {
      source.close();
    };
  }, [prompt]);

  const bestRouteTitle = String(state.bestRoute?.headline || "Batam Centre Morning Ferry");
  const bestRoutePrice = String(state.bestRoute?.price || "Pending");
  const bestRouteDeparture = String(state.bestRoute?.departure || "Pending");
  const bestRouteAvailability = String(state.bestRoute?.availability || state.bestRoute?.travel_time || "Pending");
  const bestRouteSignal = String(state.socialSignal?.sentiment || "Pending");
  const bestRouteReason = String(
    state.bestRoute?.confidence_note ||
      state.bestRoute?.reason ||
      "The strongest route will appear here as soon as the transport and social scouts finish."
  );
  const scoutCoverage = `${state.scouts.filter((scout) => scout.status === "completed").length} live sources checked`;

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <GlassPanel className="relative overflow-hidden p-10 md:col-span-8">
        <div className="absolute right-8 top-8 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-emerald-100">
          Live validation active
        </div>
        <span className="block text-[9px] uppercase tracking-[0.36em] text-cyan-300/60">Recommended route</span>
        <h2 className="mt-4 max-w-lg font-headline text-5xl font-light leading-[1.02] text-white">{bestRouteTitle}</h2>

        <div className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">{bestRouteReason}</div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Price</div>
            <div className="mt-2 text-lg text-cyan-100">{bestRoutePrice}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Departure</div>
            <div className="mt-2 text-lg text-cyan-100">{bestRouteDeparture}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Availability</div>
            <div className="mt-2 text-lg text-cyan-100">{bestRouteAvailability}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Ground truth</div>
            <div className="mt-2 text-lg capitalize text-emerald-100">{bestRouteSignal}</div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <p className="max-w-xl text-sm leading-relaxed text-slate-300">{prompt}</p>
          <Link
            className="teal-button rounded-2xl px-7 py-4 text-sm font-semibold transition-transform hover:scale-[1.02]"
            href={`/discovery-report?prompt=${encodeURIComponent(prompt)}`}
          >
            Review concierge brief
          </Link>
        </div>

        {state.error ? <p className="mt-5 text-sm text-rose-200">{state.error}</p> : null}
      </GlassPanel>

      <GlassPanel className="p-8 md:col-span-4">
        <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Live scout state</div>
        <h3 className="mt-3 font-headline text-[2rem] font-light text-white">What the agent checked</h3>
        <div className="mt-6 space-y-3">
          {[
            {
              eyebrow: "Scout Coverage",
              title: scoutCoverage,
              description: state.status
            },
            {
              eyebrow: "Best Route",
              title: bestRouteTitle,
              description: `${bestRouteDeparture} • ${bestRoutePrice}`
            },
            {
              eyebrow: "Ground Truth",
              title: bestRouteSignal,
              description:
                bestRouteSignal === "Pending"
                  ? "Waiting for the social scout to complete."
                  : "Latest community chatter has been folded into the route ranking."
            }
          ].map((highlight) => (
            <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4" key={highlight.eyebrow}>
              <div className="text-[9px] uppercase tracking-[0.26em] text-cyan-300/70">{highlight.eyebrow}</div>
              <div className="mt-2 text-lg text-white">{highlight.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{highlight.description}</p>
            </div>
          ))}
        </div>
      </GlassPanel>

      {state.logs.length ? (
        <GlassPanel className="p-8 md:col-span-5">
          <div className="mb-5 text-[10px] uppercase tracking-[0.28em] text-cyan-300">Live agent log</div>
          <div className="grid gap-4 lg:grid-cols-2">
            {state.logs.map((log) => (
              <div className="flex gap-3 rounded-[1.5rem] border border-white/5 bg-white/5 p-4" key={log.id}>
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{log.label}</div>
                  <div className="mt-1 text-sm text-slate-300">{log.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}

      <div className="grid gap-6 md:col-span-7 md:grid-cols-2 xl:grid-cols-3">
        {state.scouts.map((scout) => (
          <GlassPanel className="p-8" key={scout.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300">{scout.lane} scout</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{scout.status}</div>
            </div>
            <h3 className="mt-4 font-headline text-3xl text-white">{scout.label}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{scout.summary}</p>

            {scout.result ? (
              <div className="mt-5 rounded-[1.5rem] border border-white/5 bg-white/5 p-4 font-mono text-xs text-slate-300">
                {Object.entries(scout.result).map(([key, value]) => (
                  <div className="flex justify-between gap-4 py-1" key={key}>
                    <span className="uppercase tracking-[0.16em] text-slate-500">{key}</span>
                    <span className="text-right text-slate-200">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
