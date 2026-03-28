import Link from "next/link";

import { GlassCard } from "@/components/cards";
import { PageShell } from "@/components/layout/page-shell";
import { missionEvents } from "@/lib/open-voyage-data";

export default function MissionControlPage() {
  return (
    <PageShell
      eyebrow="Mission Control // Phase 2"
      title="Live travel orchestration"
      subtitle="The imported timeline is adapted into a proper operations view with room for SSE events, agent state, and intervention alerts."
    >
      <section className="grid gap-8 lg:grid-cols-[0.85fr_1.35fr]">
        <div className="grid gap-6">
          <GlassCard>
            <div className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Emergency signal</div>
              <h2 className="font-headline text-3xl text-white">Checkpoint slowdown detected</h2>
              <p className="text-sm leading-relaxed text-slate-300">
                This alert block is where the human-facing mission narrative lives once TinyFish scouts or social sentiment detect operational risk.
              </p>
            </div>
          </GlassCard>
          <GlassCard>
            <div className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">System integrity</div>
              <div className="text-4xl text-cyan-200">98.4%</div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[98.4%] rounded-full bg-cyan-300" />
              </div>
              <p className="text-sm text-slate-400">Ready for a real SSE stream from `/api/thinking-trace` and persisted browser session state.</p>
            </div>
          </GlassCard>
        </div>
        <GlassCard className="relative overflow-hidden">
          <div className="absolute left-8 top-8 bottom-8 w-px bg-cyan-300/20" />
          <div className="space-y-8 pl-10">
            {missionEvents.map((event) => (
              <div className="relative space-y-2" key={event.title}>
                <div
                  className={`absolute -left-[2.85rem] top-1 h-5 w-5 rounded-full border ${
                    event.status === "active"
                      ? "border-cyan-300 bg-cyan-300"
                      : event.status === "complete"
                        ? "border-cyan-300 bg-cyan-300/30"
                        : "border-slate-500 bg-slate-800"
                  }`}
                />
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-headline text-3xl text-white">{event.title}</h3>
                  <span className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">{event.time}</span>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-300">{event.description}</p>
              </div>
            ))}
            <Link className="inline-flex rounded-full border border-cyan-300/30 px-5 py-3 font-mono text-xs uppercase tracking-[0.28em] text-cyan-200" href="/discovery-report">
              Review synthesis
            </Link>
          </div>
        </GlassCard>
      </section>
    </PageShell>
  );
}
