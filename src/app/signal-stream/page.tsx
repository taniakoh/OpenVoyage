import Link from "next/link";

import { GlassCard } from "@/components/cards";
import { PageShell } from "@/components/layout/page-shell";
import { resultCards } from "@/lib/open-voyage-data";

export default function SignalStreamPage() {
  return (
    <PageShell
      eyebrow="Signal Stream // Phase 3"
      title="Parallel discovery results"
      subtitle="This page is reworked from the Stitch export into a results surface that matches the architecture doc: multiple scouts, live verification badges, and a handoff to mission control."
    >
      <section className="grid gap-8 md:grid-cols-12">
        <GlassCard className="md:col-span-7">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-cyan-400/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">
                Live Sentry verified
              </span>
              <span className="font-mono text-xs text-slate-400">4 scouts • 12 sources • 1 active stream</span>
            </div>
            <h2 className="font-headline text-4xl text-white md:text-5xl">Best current route: Batam 06:40 quiet-window sailing</h2>
            <p className="max-w-2xl text-base leading-relaxed text-slate-300">
              The imported design suggested a cinematic recommendation grid. In the scaffolded app, that becomes a real ranking surface ready to receive TinyFish scout results and ground-truth summaries.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Price</div>
                <div className="mt-2 text-2xl text-cyan-200">SGD 52</div>
              </div>
              <div className="rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Travel time</div>
                <div className="mt-2 text-2xl text-cyan-200">1h 10m</div>
              </div>
              <div className="rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Sentinel pulse</div>
                <div className="mt-2 text-2xl text-cyan-200">Stable</div>
              </div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="md:col-span-5">
          <div className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Thinking trace</div>
            {["Intent parsed", "TinyFish ferry scout launched", "Reddit checkpoint thread scored", "Results merged"].map((step) => (
              <div className="flex items-center gap-3" key={step}>
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 aurora-dot" />
                <span className="text-sm text-slate-300">{step}</span>
              </div>
            ))}
            <Link
              className="inline-flex rounded-full bg-cyan-300 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-slate-950"
              href="/mission-control"
            >
              Open mission control
            </Link>
          </div>
        </GlassCard>
        {resultCards.map((card) => (
          <GlassCard className="md:col-span-4" key={card.name}>
            <div className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Scout result</div>
              <h3 className="font-headline text-3xl text-white">{card.name}</h3>
              <p className="text-sm text-slate-300">{card.detail}</p>
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
                Intelligence score: {card.intelligenceScore}
              </div>
            </div>
          </GlassCard>
        ))}
      </section>
    </PageShell>
  );
}
