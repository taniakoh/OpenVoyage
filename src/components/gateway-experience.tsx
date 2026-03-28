"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { BottomHud, GlassPanel, ScenicBackdrop, SideOrbitDock, TopBar } from "@/components/cinematic-ui";
import { defaultGatewayPrompt, signalHighlights, supportedSources } from "@/lib/open-voyage-data";

type ScoutStatus = "queued" | "running" | "complete";

type ScoutPreview = {
  id: string;
  label: string;
  detail: string;
  status: ScoutStatus;
};

const initialScoutPreview: ScoutPreview[] = [
  { id: "intent", label: "Intent parser", detail: "Waiting for your trip brief", status: "queued" },
  { id: "operators", label: "Operator scout", detail: "Ready to check routes and fares", status: "queued" },
  { id: "social", label: "Ground-truth scout", detail: "Ready to scan Reddit and local updates", status: "queued" }
];

const workflowCards = [
  {
    eyebrow: "Intent parsing",
    title: "We turn one sentence into a travel brief",
    description: "Dates, budget, departure window, and tone are extracted before any route gets ranked."
  },
  {
    eyebrow: "Live scouting",
    title: "We check operators and social signals together",
    description: "OpenVoyage compares bookable options with traveler chatter so results are grounded in reality."
  },
  {
    eyebrow: "Decision support",
    title: "You see why a route is recommended",
    description: "The next screen keeps the evidence visible, instead of hiding it behind a generic search result."
  }
] as const;

function statusFromEvent(type: string | undefined): ScoutStatus {
  if (type === "complete" || type === "completed") {
    return "complete";
  }

  if (type === "running" || type === "intent" || type === "status" || type === "log") {
    return "running";
  }

  return "queued";
}

export function GatewayExperience() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const [prompt, setPrompt] = useState(defaultGatewayPrompt);
  const [statusLine, setStatusLine] = useState("Gateway ready. Describe a trip to preview how the scouts will work together.");
  const [scoutPreview, setScoutPreview] = useState<ScoutPreview[]>(initialScoutPreview);

  useEffect(() => {
    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length < 10) {
      sourceRef.current?.close();
      sourceRef.current = null;
      setScoutPreview(initialScoutPreview);
      setStatusLine("Gateway ready. Describe a trip to preview how the scouts will work together.");
      return;
    }

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    reconnectTimer.current = setTimeout(() => {
      sourceRef.current?.close();

      const source = new EventSource(`/api/search/stream?prompt=${encodeURIComponent(trimmedPrompt)}`);
      sourceRef.current = source;

      source.onmessage = (message) => {
        const payload = JSON.parse(message.data) as Record<string, unknown>;

        if (payload.type === "status") {
          const detail = typeof payload.message === "string" ? payload.message : "Preparing the scout run.";
          setStatusLine(`Live preview: ${detail}`);
          setScoutPreview((current) =>
            current.map((item, index) =>
              index === 0 ? { ...item, detail, status: "running" } : item
            )
          );
          return;
        }

        if (payload.type === "intent") {
          setStatusLine("Live preview: intent parsed and scouting lanes are warming up.");
          setScoutPreview((current) =>
            current.map((item) =>
              item.id === "intent"
                ? { ...item, detail: "Trip brief structured successfully", status: "complete" }
                : item.id === "operators" || item.id === "social"
                  ? { ...item, status: "running" }
                  : item
            )
          );
          return;
        }

        if (payload.type === "scout") {
          const scoutLabel = typeof payload.scoutLabel === "string" ? payload.scoutLabel : "";
          const detail = typeof payload.message === "string" ? payload.message : "Scout update received.";
          const nextStatus = statusFromEvent(typeof payload.status === "string" ? payload.status : undefined);
          const normalizedLabel = scoutLabel.toLowerCase();

          setStatusLine(`Live preview: ${scoutLabel || "Scout"} ${detail.toLowerCase()}`);
          setScoutPreview((current) =>
            current.map((item) => {
              if (normalizedLabel.includes("intent") && item.id === "intent") {
                return { ...item, detail, status: nextStatus };
              }

              if (
                (normalizedLabel.includes("social") || normalizedLabel.includes("reddit") || normalizedLabel.includes("signal")) &&
                item.id === "social"
              ) {
                return { ...item, detail, status: nextStatus };
              }

              if (
                (normalizedLabel.includes("ferry") ||
                  normalizedLabel.includes("operator") ||
                  normalizedLabel.includes("rail") ||
                  normalizedLabel.includes("flight")) &&
                item.id === "operators"
              ) {
                return { ...item, detail, status: nextStatus };
              }

              return item;
            })
          );
          return;
        }

        if (payload.type === "complete") {
          setStatusLine("Live preview: route synthesis complete. Open the signal stream for the full breakdown.");
          setScoutPreview((current) => current.map((item) => ({ ...item, status: "complete" })));
          source.close();
          sourceRef.current = null;
        }
      };

      source.onerror = () => {
        setStatusLine("Live preview: stream interrupted. You can still open the full signal stream.");
        source.close();
        sourceRef.current = null;
      };
    }, 320);

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [prompt]);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/signal-stream?prompt=${encodeURIComponent(prompt.trim() || defaultGatewayPrompt)}`);
  };

  return (
    <>
      <TopBar active="explore" />
      <ScenicBackdrop />
      <SideOrbitDock />

      <main className="relative min-h-screen overflow-hidden px-5 pb-28 pt-28 md:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[52vh] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%),linear-gradient(180deg,rgba(6,10,22,0.08)_0%,rgba(6,10,22,0.42)_70%,rgba(6,10,22,0)_100%)]" />

        <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-start">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-cyan-200/80 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.75)]" />
              Guided gateway
            </div>

            <h1 className="mt-7 max-w-4xl font-headline text-5xl leading-[0.94] text-white md:text-7xl">
              Travel planning that
              <br />
              <span className="font-light italic text-white/82">shows its work.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-200/92 md:text-lg">
              Tell OpenVoyage what kind of trip you want. We will turn that request into a structured brief, check live
              sources, and explain why a route is worth trusting before you commit.
            </p>

            <GlassPanel className="mt-8 overflow-hidden p-4 md:p-5">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="gateway-prompt">
                  Describe your trip
                </label>

                <div className="rounded-[1.6rem] border border-white/8 bg-black/15 p-3 md:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/72">Trip brief</div>
                      <div className="mt-1 text-sm text-slate-400">One sentence is enough to get the scouts moving.</div>
                    </div>
                    <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-cyan-100">
                      Live preview on
                    </div>
                  </div>

                  <textarea
                    className="min-h-[112px] w-full resize-none border-0 bg-transparent text-base leading-relaxed text-white outline-none placeholder:text-slate-500 md:text-lg"
                    id="gateway-prompt"
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Find me the calmest morning ferry, keep it affordable, and check whether the checkpoint mood is still clear."
                    value={prompt}
                  />
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                    Launching the next step opens the full signal stream with source checks, route ranking, and supporting evidence.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="ghost-button rounded-full px-4 py-2.5 text-[10px] uppercase tracking-[0.28em] text-slate-200 transition-colors hover:text-white"
                      onClick={() => setPrompt(defaultGatewayPrompt)}
                      type="button"
                    >
                      Use example
                    </button>
                    <button
                      className="teal-button rounded-full px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.32em] transition-transform hover:scale-[1.02]"
                      type="submit"
                    >
                      Open signal stream
                    </button>
                  </div>
                </div>
              </form>
            </GlassPanel>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-2 text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">Scouting sources</span>
              {supportedSources.map((source) => (
                <span
                  className="rounded-full border border-white/10 bg-slate-950/30 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-200 backdrop-blur-xl"
                  key={source}
                >
                  {source}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 18 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <GlassPanel className="overflow-hidden p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/72">Behind the scenes</div>
              <h2 className="mt-3 font-headline text-3xl text-white">What happens after you type?</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The homepage stays simple, but the system underneath is still active. Here is the live handoff we preview before the deeper analysis screen opens.
              </p>

              <div className="mt-6 space-y-3">
                {scoutPreview.map((item) => (
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/5 p-4" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/80">{item.label}</div>
                        <div className="mt-2 text-sm leading-relaxed text-slate-300">{item.detail}</div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
                          item.status === "complete"
                            ? "bg-emerald-400/15 text-emerald-200"
                            : item.status === "running"
                              ? "bg-cyan-300/15 text-cyan-100"
                              : "bg-white/8 text-slate-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-relaxed text-slate-300">
                {statusLine}
              </div>
            </GlassPanel>
          </motion.div>
        </section>

        <section className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
          {workflowCards.map((card) => (
            <GlassPanel className="p-6" key={card.title}>
              <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/72">{card.eyebrow}</div>
              <h3 className="mt-3 font-headline text-2xl text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.description}</p>
            </GlassPanel>
          ))}
        </section>

        <section className="mx-auto mt-4 grid max-w-6xl gap-4 md:grid-cols-3">
          {signalHighlights.map((highlight) => (
            <GlassPanel className="p-6" key={highlight.title}>
              <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/72">{highlight.eyebrow}</div>
              <h3 className="mt-3 text-xl font-semibold text-white">{highlight.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{highlight.description}</p>
            </GlassPanel>
          ))}
        </section>
      </main>

      <BottomHud
        left="Gateway ready. Parse intent, scout live sources, and explain every route recommendation."
        signal="98.4%"
      />
    </>
  );
}
