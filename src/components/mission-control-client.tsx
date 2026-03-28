"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BottomHud, GlassPanel, ScenicBackdrop, TopBar } from "@/components/cinematic-ui";
import { buildLiveSentrySnapshot, type LiveSentrySnapshot, type LiveSentryTimelineEvent } from "@/lib/live-sentry";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

type MissionControlClientProps = {
  initialSnapshot?: LiveSentrySnapshot;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Singapore"
  }).format(new Date(value));
}

function eventDotClass(status: LiveSentryTimelineEvent["status"]) {
  if (status === "complete") {
    return "bg-cyan-300 text-slate-950 shadow-[0_0_18px_rgba(0,229,255,0.35)]";
  }

  if (status === "active") {
    return "border border-cyan-300/40 bg-[#050b18] text-cyan-300";
  }

  if (status === "alert") {
    return "border border-[#ffb4a3]/40 bg-[#180d14] text-[#ffb4a3]";
  }

  return "border border-white/10 bg-white/5 text-slate-400";
}

export function MissionControlClient({ initialSnapshot }: MissionControlClientProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot ?? buildLiveSentrySnapshot("stable"));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(Boolean(initialSnapshot));

  useEffect(() => {
    let isMounted = true;

    const loadSnapshot = async () => {
      try {
        setIsRefreshing(true);
        const response = await fetch("/api/live-sentry", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Live Sentry failed to refresh.");
        }

        const nextSnapshot = (await response.json()) as LiveSentrySnapshot;

        if (!isMounted) {
          return;
        }

        setSnapshot(nextSnapshot);
        setError(null);
        setHasLoaded(true);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Live Sentry failed to refresh.");
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    void loadSnapshot();
    const intervalId = window.setInterval(loadSnapshot, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const alertTone =
    snapshot.alert?.severity === "critical"
      ? "border-[#ff8d7a]/60 bg-[linear-gradient(120deg,rgba(255,141,122,0.2),rgba(29,13,24,0.75))]"
      : "border-[#fec931]/30 bg-[linear-gradient(120deg,rgba(254,201,49,0.18),rgba(13,19,33,0.72))]";

  const refreshSnapshot = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/live-sentry", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Live Sentry failed to refresh.");
      }

      setSnapshot((await response.json()) as LiveSentrySnapshot);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Live Sentry failed to refresh.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <ScenicBackdrop />
      <TopBar active="history" glass />

      <main className="relative px-5 pb-28 pt-28 md:px-12 lg:px-20">
        <section className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-4">
            <div className="max-w-sm">
              <h1 className="font-headline text-5xl font-light leading-[0.92] text-white md:text-6xl">
                Live
                <br />
                <span className="italic text-white/70">Sentry</span>
              </h1>
              <p className="mt-5 text-sm leading-relaxed text-slate-300">{snapshot.summary}</p>
              {!hasLoaded ? <p className="mt-3 text-xs uppercase tracking-[0.22em] text-cyan-300/70">Fetching live sentry snapshot...</p> : null}
            </div>

            <div
              className={`transform transition-all duration-500 ${
                snapshot.alert ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
              }`}
            >
              <GlassPanel className={`border-l-2 p-7 ${snapshot.alert ? alertTone : "pointer-events-none"}`}>
                {snapshot.alert ? (
                  <div className="flex gap-4">
                    <div className="pt-1 text-[#ffb4a3]">!</div>
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.28em] text-[#ffd9d1]/70">Emergency Signal</div>
                      <h2 className="mt-2 font-headline text-xl text-white">{snapshot.alert.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-200">{snapshot.alert.summary}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#ffd9d1]/70">
                        Impact: {snapshot.alert.impact}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{snapshot.alert.recommendation}</p>
                      <div className="mt-4 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.24em] text-[#ffd9d1]">
                        <span>Detected {snapshot.alert.detectedAt}</span>
                        <button className="text-[#fff0ec]" type="button">
                          Review backup options
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">No active delay clusters</div>
                )}
              </GlassPanel>
            </div>

            <GlassPanel className="space-y-8 p-7">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">System Integrity</span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
              </div>

              <div>
                <div className="mb-3 flex justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  <span>Sync Strength</span>
                  <span className="text-cyan-300">{snapshot.syncStrength.toFixed(1)}%</span>
                </div>
                <div className="h-px overflow-hidden bg-white/10">
                  <div
                    className="h-full bg-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]"
                    style={{ width: `${snapshot.syncStrength}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-4">
                  <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Last Sweep</div>
                  <div className="mt-2 text-sm text-white">{formatTimestamp(snapshot.refreshedAt)}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-4">
                  <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Next Sweep</div>
                  <div className="mt-2 text-sm text-white">{formatTimestamp(snapshot.nextRefreshAt)}</div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-cyan-300/10 bg-cyan-300/5 p-4">
                <div className="text-[9px] uppercase tracking-[0.24em] text-cyan-300/80">Alert Logic</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Live Sentry refreshes social sentiment and operator signals every 30 minutes after booking so delays can be caught early.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  className="teal-button rounded-[1.2rem] px-5 py-4 text-base font-medium"
                  disabled={isRefreshing}
                  onClick={refreshSnapshot}
                  type="button"
                >
                  {isRefreshing ? "Refreshing..." : "Re-scan Environment"}
                </button>
                <Link
                  className="ghost-button rounded-[1.2rem] px-5 py-4 text-center text-[10px] uppercase tracking-[0.28em] text-cyan-300"
                  href="/discovery-report"
                >
                  Review Synthesis
                </Link>
              </div>

              {error ? <p className="text-sm text-rose-200">{error}</p> : null}
            </GlassPanel>
          </div>

          <div className="space-y-10 lg:col-span-8">
            <GlassPanel className="relative h-[300px] overflow-hidden">
              <Image
                alt=""
                className="object-cover opacity-65"
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                src="/stitch/openvoyage-basin.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1321] via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[9px] uppercase tracking-[0.24em] text-cyan-300">
                    {snapshot.itinerary.status}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.24em] text-slate-400">ID: {snapshot.itinerary.id}</span>
                </div>
                <h2 className="font-headline text-4xl font-light text-white">{snapshot.itinerary.route}</h2>
                <div className="mt-4 grid gap-3 text-sm text-slate-200 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Window</div>
                    <div className="mt-2">{snapshot.itinerary.window}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Destination</div>
                    <div className="mt-2">{snapshot.itinerary.destination}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Operator</div>
                    <div className="mt-2">{snapshot.itinerary.operator}</div>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                { label: "Social Pulse", value: snapshot.socialPulse.sentiment },
                { label: "Queue Delta", value: snapshot.socialPulse.queueDelta },
                { label: "Source Confidence", value: snapshot.socialPulse.confidence }
              ].map((stat) => (
                <GlassPanel className="p-6" key={stat.label}>
                  <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">{stat.label}</div>
                  <div className="mt-3 font-headline text-3xl font-light text-white">{stat.value}</div>
                </GlassPanel>
              ))}
            </div>

            <GlassPanel className="grid gap-5 p-7 md:grid-cols-2">
              <div>
                <div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/70">Signal Context</div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  The monitoring lane keeps sampling community chatter, booking stability, and checkpoint movement so the route can self-heal before handoff.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-4">
                  <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Chatter Velocity</div>
                  <div className="mt-2 text-lg text-white">{snapshot.socialPulse.chatterVelocity}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-4">
                  <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">Sources</div>
                  <div className="mt-2 text-lg text-white">{snapshot.socialPulse.source}</div>
                </div>
              </div>
            </GlassPanel>

            <div className="relative pl-10 md:pl-14">
              <div className="absolute left-4 top-3 h-[calc(100%-1.5rem)] w-px bg-white/5 md:left-[1.2rem]" />
              <div className="teal-thread absolute left-4 top-3 h-[calc(100%-5rem)] w-px md:left-[1.2rem]" />

              <div className="space-y-10">
                {snapshot.timeline.map((event) => (
                  <div
                    className={`relative ${event.status === "upcoming" ? "opacity-35 grayscale" : ""}`}
                    key={event.id}
                  >
                    <div
                      className={`absolute -left-10 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs md:-left-14 md:h-10 md:w-10 ${eventDotClass(event.status)}`}
                    >
                      {event.status === "complete" ? "OK" : event.status === "alert" ? "!" : event.status === "active" ? "." : "o"}
                    </div>

                    <GlassPanel
                      className={`ml-2 p-7 ${
                        event.status === "active"
                          ? "border-l-2 border-cyan-300 shadow-[0_0_24px_rgba(0,229,255,0.08)]"
                          : event.status === "alert"
                            ? "border-l-2 border-[#ffb4a3] shadow-[0_0_24px_rgba(255,180,163,0.08)]"
                            : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3
                            className={`font-headline text-2xl ${
                              event.status === "active"
                                ? "text-cyan-300"
                                : event.status === "alert"
                                  ? "text-[#ffb4a3]"
                                  : "text-white"
                            }`}
                          >
                            {event.title}
                          </h3>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{event.description}</p>
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.24em] text-slate-400">{event.time}</span>
                      </div>

                      {event.metrics?.length ? (
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                          {event.metrics.map((stat) => (
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center" key={stat.label}>
                              <div className="text-[9px] uppercase tracking-[0.24em] text-slate-400">{stat.label}</div>
                              <div className="mt-2 text-xl font-mono text-white">{stat.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </GlassPanel>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomHud
        center={<span className="text-cyan-300/70">Auto re-scrape every {snapshot.intervalMinutes} minutes</span>}
        left="Agent logs: live sentry monitoring active."
        signal={`${snapshot.syncStrength.toFixed(1)}%`}
      />
    </>
  );
}
