import Link from "next/link";

import { GlassCard } from "@/components/cards";
import { PageShell } from "@/components/layout/page-shell";
import { discoveryBullets } from "@/lib/open-voyage-data";

export default function DiscoveryReportPage() {
  return (
    <PageShell
      eyebrow="Concierge Brief // Ground Truth"
      title="Discovery synthesis"
      subtitle="This is the report view for combining scraped travel options with qualitative social evidence, adapted from the Stitch concept into a developer-friendly screen."
    >
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="space-y-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Ground Truth Protocol</div>
          <h2 className="font-headline text-4xl text-white">The quiet pocket is real, but only inside a narrow departure window.</h2>
          <p className="text-lg leading-relaxed text-slate-300">
            The imported report screen now maps directly to the architecture document: sentiment signals, strict summarization, and an explanation layer before execution.
          </p>
          <div className="space-y-3">
            {discoveryBullets.map((item) => (
              <div className="flex gap-3" key={item}>
                <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300 aurora-dot" />
                <p className="text-sm leading-relaxed text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="space-y-6">
          <div className="aspect-[4/3] rounded-[24px] border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.24),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.5),rgba(2,6,23,0.75))]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Signal strength</div>
              <div className="mt-2 text-3xl text-cyan-200">94.2%</div>
            </div>
            <div className="rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">Verification pool</div>
              <div className="mt-2 text-3xl text-cyan-200">7 sources</div>
            </div>
          </div>
          <Link className="inline-flex rounded-full bg-cyan-300 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-slate-950" href="/booking-hud">
            Continue to execution
          </Link>
        </GlassCard>
      </section>
    </PageShell>
  );
}
