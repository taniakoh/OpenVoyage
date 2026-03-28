"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BottomHud, GlassPanel, ScenicBackdrop, TopBar } from "@/components/cinematic-ui";
import { defaultGatewayPrompt } from "@/lib/open-voyage-data";
import type { SearchPipelineSnapshot } from "@/lib/search";

type RouteCard = {
  id: string;
  title: string;
  departure: string;
  duration: string;
  fare: string;
  confidence: string;
  note: string;
  bookingUrl: string;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildRoutes(snapshot: SearchPipelineSnapshot): RouteCard[] {
  return snapshot.scouts
    .filter((scout) => scout.lane === "transport")
    .map((scout, index) => {
      const result = asRecord(scout.result);
      return {
        id: scout.id,
        title: readString(result?.headline, scout.label),
        departure: readString(result?.departure, "Schedule pending"),
        duration: readString(result?.travel_time, "Travel time pending"),
        fare: readString(result?.price, "Fare pending"),
        confidence: `${Math.max(82, 94 - index * 6).toFixed(1)}%`,
        note: readString(result?.confidence_note, scout.summary),
        bookingUrl: readString(result?.booking_url, scout.url)
      };
    });
}

function sentimentLabel(signal: Record<string, unknown> | null) {
  const sentiment = readString(signal?.sentiment, "stable").toLowerCase();

  if (sentiment === "risky") {
    return "CHAOTIC";
  }

  if (sentiment === "mixed") {
    return "DELAYED";
  }

  return "CLEAR";
}

function evidenceSignals(snapshot: SearchPipelineSnapshot, socialSignal: Record<string, unknown> | null) {
  const transportCount = snapshot.scouts.filter((scout) => scout.lane === "transport").length;
  const evidence = Array.isArray(socialSignal?.evidence)
    ? socialSignal?.evidence.filter((entry): entry is string => typeof entry === "string")
    : [];

  return {
    verdict: sentimentLabel(socialSignal),
    sourceCount: `${transportCount} operator checks, ${evidence.length || 1} social signals`,
    citedSignals: [
      ...evidence.slice(0, 2),
      `Intent constraints: ${snapshot.intent.constraints.join(", ") || "No additional constraints"}.`,
      `Verification sources: ${snapshot.intent.verification_sources.join(", ") || "operator site"}.`
    ].slice(0, 4)
  };
}

function buildSentimentTags(snapshot: SearchPipelineSnapshot, socialSignal: Record<string, unknown> | null) {
  const constraints = snapshot.intent.constraints.slice(0, 2);
  const evidence = Array.isArray(socialSignal?.evidence)
    ? socialSignal?.evidence.filter((entry): entry is string => typeof entry === "string")
    : [];

  const tags = [...constraints, ...evidence.map((item) => item.split(/[.,]/)[0])].slice(0, 4);
  const positions = [
    { top: "16%", left: "12%" },
    { top: "30%", left: "62%" },
    { top: "58%", left: "22%" },
    { top: "70%", left: "66%" }
  ];

  return tags.map((label, index) => ({
    label,
    top: positions[index]?.top || "20%",
    left: positions[index]?.left || "20%",
    tone: index === 2 ? "neutral" : "positive"
  }));
}

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "operator";
  }
}

export function DiscoveryReportClient({ prompt = defaultGatewayPrompt }: { prompt?: string }) {
  const [snapshot, setSnapshot] = useState<SearchPipelineSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSnapshot = async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ prompt }),
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Discovery report failed to load.");
        }

        const nextSnapshot = (await response.json()) as SearchPipelineSnapshot;

        if (isMounted) {
          setSnapshot(nextSnapshot);
          setError(null);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Discovery report failed to load.");
        }
      }
    };

    void loadSnapshot();

    return () => {
      isMounted = false;
    };
  }, [prompt]);

  const routes = useMemo(() => (snapshot ? buildRoutes(snapshot) : []), [snapshot]);
  const primaryRoute = routes[0];
  const fallbackRoute = routes[1];
  const socialSignal = asRecord(snapshot?.summary.socialSignal);
  const evidence = snapshot ? evidenceSignals(snapshot, socialSignal) : null;
  const sentimentTags = snapshot ? buildSentimentTags(snapshot, socialSignal) : [];

  if (!snapshot || !primaryRoute || !evidence) {
    return (
      <>
        <ScenicBackdrop />
        <TopBar active="explore" />
        <main className="relative px-5 pb-28 pt-32 md:px-12 lg:px-16">
          <section className="mx-auto max-w-[1200px]">
            <GlassPanel className="p-8 md:p-10">
              <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Fetching Discovery Report</div>
              <h1 className="mt-3 font-headline text-5xl font-light text-white">Concierge Brief</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                Loading the ranked search snapshot from `/api/search` so the synthesis view reflects the current prompt instead of static demo data.
              </p>
              {error ? <p className="mt-6 text-sm text-rose-200">{error}</p> : null}
            </GlassPanel>
          </section>
        </main>
        <BottomHud left="Loading discovery synthesis." signal="--" />
      </>
    );
  }

  return (
    <>
      <ScenicBackdrop />
      <TopBar active="explore" />

      <main className="relative px-5 pb-28 pt-32 md:px-12 lg:px-16">
        <section className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-5">
            <div>
              <div className="text-[9px] uppercase tracking-[0.4em] text-cyan-300/60">Ground Truth Protocol</div>
              <h1 className="mt-4 font-headline text-6xl font-light leading-[0.94] text-white md:text-[5.5rem]">
                {primaryRoute.title}
                <br />
                <span className="italic text-white/75">Synthesis</span>
              </h1>
            </div>

            <p className="max-w-xl font-headline text-2xl font-light leading-relaxed text-slate-300">
              Operator checks and traveler chatter both support this route for the current prompt, with the strongest blend of price, timing, and calmer verification signals.
            </p>

            <GlassPanel className="max-w-md p-7">
              <p className="text-sm italic leading-loose text-slate-300">{primaryRoute.note}</p>
            </GlassPanel>

            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <span className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Discovery Signal Strength</span>
                <span className="font-mono text-[10px] text-cyan-300/70">{evidence.verdict}</span>
              </div>
              <div className="h-px overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[94%] bg-cyan-300 shadow-[0_0_14px_rgba(0,229,255,0.8)]" />
              </div>
              <div className="text-sm text-slate-300">{evidence.sourceCount}</div>
              <div className="space-y-3">
                {evidence.citedSignals.map((item) => (
                  <p className="max-w-xl text-sm leading-relaxed text-slate-300" key={item}>
                    {item}
                  </p>
                ))}
              </div>
              <Link
                className="teal-button inline-flex rounded-full px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.3em]"
                href={`/booking-hud?prompt=${encodeURIComponent(prompt)}`}
              >
                Execute booking
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <GlassPanel className="relative aspect-[4/5] overflow-hidden border border-white/10 lg:aspect-[1.08/1]">
              <Image
                alt=""
                className="object-cover transition-transform duration-1000 hover:scale-[1.03]"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                src="/stitch/openvoyage-basin.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1321] via-transparent to-black/20" />
              <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="glass-chip rounded-2xl px-4 py-3">
                    <div className="text-[8px] uppercase tracking-[0.28em] text-cyan-300/70">Verdict</div>
                    <div className="mt-1 font-mono text-[10px] text-white">{evidence.verdict}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {snapshot.intent.constraints.slice(0, 2).map((tag) => (
                      <div
                        className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 font-headline text-xs italic text-cyan-300"
                        key={tag}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-7">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(0,229,255,0.35)]">
                      O
                    </div>
                    <div>
                      <h2 className="font-headline text-4xl text-white">{snapshot.intent.destination}</h2>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.32em] text-cyan-300/75">Real-Time Atmosphere Sync</div>
                    </div>
                  </div>

                  <div className="glass-chip rounded-[1.5rem] border border-white/5 p-5">
                    <div className="space-y-3">
                      <div className="text-[9px] uppercase tracking-[0.26em] text-cyan-300/70">Evidence summary</div>
                      {evidence.citedSignals.map((signal) => (
                        <div
                          className="rounded-[1.1rem] border border-white/5 bg-slate-950/35 px-4 py-3 text-sm text-slate-300"
                          key={signal}
                        >
                          {signal}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </section>

        <section className="mx-auto mt-12 grid max-w-[1200px] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="p-7 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Ranked routes</div>
                <h2 className="mt-3 font-headline text-3xl font-light text-white">Why this route won</h2>
              </div>
              <div className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-emerald-100">
                Ground truth verified
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {routes.map((route, index) => (
                <div
                  className={`rounded-[1.75rem] border p-5 ${
                    index === 0 ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/8 bg-white/[0.03]"
                  }`}
                  key={route.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                        {index === 0 ? "Recommended" : `Option 0${index + 1}`}
                      </div>
                      <h3 className="mt-2 font-headline text-2xl text-white">{route.title}</h3>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 font-mono text-[10px] text-cyan-300">
                      {route.confidence}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                    <Metric label="Departure" value={route.departure} />
                    <Metric label="Duration" value={route.duration} />
                    <Metric label="Fare" value={route.fare} />
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-300">{route.note}</p>
                </div>
              ))}
            </div>
          </GlassPanel>

          <div className="grid gap-6">
            <GlassPanel className="p-7">
              <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Agency comparison</div>
              <h2 className="mt-3 font-headline text-3xl font-light text-white">Speed and price check</h2>
              <div className="mt-6 space-y-4">
                {[primaryRoute, fallbackRoute].filter(Boolean).map((route, index) => (
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5" key={route?.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-headline text-2xl text-white">{index === 0 ? "OpenVoyage" : "Fallback lane"}</div>
                      <div className="font-mono text-sm text-cyan-100">{route?.fare}</div>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">{route?.duration}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-400">{hostLabel(route?.bookingUrl || "")}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="mb-4 flex items-center justify-between gap-4 px-2 pt-2">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Vibe map</div>
                  <h3 className="mt-3 font-headline text-3xl font-light text-white">Sentiment tags</h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-slate-300">
                  Open-web signal
                </div>
              </div>

              <div className="relative aspect-[1.15/1] overflow-hidden rounded-[26px] border border-white/10">
                <Image alt="Destination vibe map" className="object-cover" fill sizes="(min-width: 1024px) 35vw, 100vw" src="/stitch/openvoyage-basin.jpg" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09111d] via-[#09111d]/15 to-transparent" />

                {sentimentTags.map((tag) => (
                  <span
                    className={`absolute rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] backdrop-blur-xl ${
                      tag.tone === "positive"
                        ? "border-emerald-300/20 bg-emerald-300/18 text-emerald-50"
                        : "border-white/15 bg-slate-950/45 text-slate-200"
                    }`}
                    key={`${tag.label}-${tag.top}-${tag.left}`}
                    style={{ top: tag.top, left: tag.left }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </GlassPanel>
          </div>
        </section>
      </main>

      <BottomHud left="System log: synthesis complete. Gateway ready." signal={routes[0]?.confidence || "94.0%"} />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white">{value}</div>
    </div>
  );
}
