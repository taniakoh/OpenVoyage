"use client";

import Image from "next/image";
import { useState } from "react";

import { GlassCard } from "@/components/cards";

type DiscoveryRoute = {
  id: string;
  title: string;
  departure: string;
  duration: string;
  fare: string;
  confidence: string;
  note: string;
  verified: boolean;
  sources: readonly string[];
};

type SentryVerification = {
  label: string;
  status: string;
  summary: string;
  checks: readonly string[];
};

type VibeTag = {
  label: string;
  tone: "positive" | "neutral";
  top: string;
  left: string;
};

type VibeMap = {
  image: string;
  alt: string;
  tags: readonly VibeTag[];
};

type DiscoverySignal = {
  label: string;
  value: string;
};

export function DiscoveryBento({
  routes,
  sentry,
  map,
  signals
}: {
  routes: readonly DiscoveryRoute[];
  sentry: SentryVerification;
  map: VibeMap;
  signals: readonly DiscoverySignal[];
}) {
  const [activeRouteId, setActiveRouteId] = useState<string>(routes[0]?.id ?? "");

  const activeRoute = routes.find((route) => route.id === activeRouteId) ?? routes[0];

  return (
    <section className="mx-auto mt-12 grid max-w-[1200px] gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <GlassCard className="rounded-[32px] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Discovery Bento</div>
            <h2 className="mt-3 font-headline text-3xl font-light text-white md:text-[2.6rem]">
              Grounded Route Ranking
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {signals.map((signal) => (
              <div
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-slate-300"
                key={signal.label}
              >
                <span className="text-slate-500">{signal.label}</span> {signal.value}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {routes.map((route, index) => {
              const isActive = route.id === activeRoute?.id;

              return (
                <button
                  className={`w-full rounded-[28px] border p-5 text-left transition ${
                    isActive
                      ? "border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_32px_rgba(0,229,255,0.12)]"
                      : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                  key={route.id}
                  onMouseEnter={() => setActiveRouteId(route.id)}
                  onFocus={() => setActiveRouteId(route.id)}
                  type="button"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                          Route 0{index + 1}
                        </span>
                        {route.verified ? <LiveSentryBadge compact /> : null}
                      </div>
                      <div className="mt-3 font-headline text-2xl text-white">{route.title}</div>
                    </div>

                    <div className="rounded-full border border-white/10 bg-[#07111f] px-3 py-1.5 font-mono text-[10px] text-cyan-300">
                      {route.confidence}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                    <Metric label="Departure" value={route.departure} />
                    <Metric label="Duration" value={route.duration} />
                    <Metric label="Fare" value={route.fare} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#050d18]/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/70">Agent&apos;s Note</div>
              <div className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.24em] text-slate-400">
                Logic Hover
              </div>
            </div>

            <div className="mt-4 font-headline text-2xl text-white">{activeRoute?.title}</div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{activeRoute?.note}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {activeRoute?.sources.map((source) => (
                <span
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-slate-300"
                  key={source}
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6">
        <GlassCard className="rounded-[32px] p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">{sentry.label}</div>
              <h3 className="mt-3 font-headline text-3xl font-light text-white">{sentry.status}</h3>
            </div>
            <LiveSentryBadge />
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-300">{sentry.summary}</p>

          <div className="mt-6 space-y-3">
            {sentry.checks.map((check) => (
              <div
                className="rounded-[24px] border border-emerald-300/10 bg-emerald-300/[0.05] px-4 py-3 text-sm text-emerald-100/90"
                key={check}
              >
                {check}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="rounded-[32px] p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-4 px-2 pt-2">
            <div>
              <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Vibe Map</div>
              <h3 className="mt-3 font-headline text-3xl font-light text-white">Sentiment Atlas</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-slate-300">
              Reddit-extracted tags
            </div>
          </div>

          <div className="relative aspect-[1.15/1] overflow-hidden rounded-[26px] border border-white/10">
            <Image alt={map.alt} className="object-cover" fill sizes="(min-width: 1024px) 35vw, 100vw" src={map.image} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09111d] via-[#09111d]/15 to-transparent" />

            {map.tags.map((tag) => (
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
        </GlassCard>
      </div>
    </section>
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

function LiveSentryBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative inline-flex items-center rounded-full border border-emerald-300/18 bg-emerald-300/10 text-emerald-100 ${
        compact ? "px-2.5 py-1 text-[9px]" : "px-4 py-2 text-[10px]"
      } uppercase tracking-[0.28em]`}
    >
      <span className="absolute inset-0 rounded-full shadow-[0_0_28px_rgba(110,231,183,0.26)] animate-pulse" />
      <span className="relative flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
        Verified
      </span>
    </div>
  );
}
