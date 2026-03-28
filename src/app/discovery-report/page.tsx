import Image from "next/image";
import Link from "next/link";

import { BottomHud, GlassPanel, ScenicBackdrop, TopBar } from "@/components/cinematic-ui";
import {
  agencyComparison,
  discoveryBullets,
  discoveryRoutes,
  evidenceSummary,
  vibeMap
} from "@/lib/open-voyage-data";

export default function DiscoveryReportPage() {
  return (
    <>
      <ScenicBackdrop />
      <TopBar active="explore" />

      <main className="relative px-5 pb-28 pt-32 md:px-12 lg:px-16">
        <section className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-5">
            <div>
              <div className="text-[9px] uppercase tracking-[0.4em] text-cyan-300/60">
                Ground Truth Protocol // 082
              </div>
              <h1 className="mt-4 font-headline text-6xl font-light leading-[0.94] text-white md:text-[5.5rem]">
                The Silent Peak
                <br />
                <span className="italic text-white/75">Synthesis</span>
              </h1>
            </div>

            <p className="max-w-xl font-headline text-2xl font-light leading-relaxed text-slate-300">
              Social chatter, operator checks, and route ranking all point to the same outcome: the 05:40 Batam Centre ferry is the calmest and most reliable option for this request.
            </p>

            <GlassPanel className="max-w-md p-7">
              <p className="text-sm italic leading-loose text-slate-300">
                Reddit reports suggest later ferries are starting to bunch up. We are prioritizing the 05:40 departure because it keeps price low while preserving a calmer checkpoint window.
              </p>
            </GlassPanel>

            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <span className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">
                  Discovery Signal Strength
                </span>
                <span className="font-mono text-[10px] text-cyan-300/70">{evidenceSummary.verdict}</span>
              </div>
              <div className="h-px overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[94%] bg-cyan-300 shadow-[0_0_14px_rgba(0,229,255,0.8)]" />
              </div>
              <div className="text-sm text-slate-300">{evidenceSummary.sourceCount}</div>
              <div className="space-y-3">
                {discoveryBullets.map((item) => (
                  <p className="max-w-xl text-sm leading-relaxed text-slate-300" key={item}>
                    {item}
                  </p>
                ))}
              </div>
              <Link
                className="teal-button inline-flex rounded-full px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.3em]"
                href="/booking-hud"
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
                    <div className="mt-1 font-mono text-[10px] text-white">{evidenceSummary.verdict}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-headline text-xs italic text-white">
                      Quiet
                    </div>
                    <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 font-headline text-xs italic text-cyan-300">
                      Hidden Gem
                    </div>
                  </div>
                </div>

                <div className="space-y-7">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(0,229,255,0.35)]">
                      O
                    </div>
                    <div>
                      <h2 className="font-headline text-4xl text-white">The OpenVoyage Basin</h2>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.32em] text-cyan-300/75">
                        Real-Time Atmosphere Sync
                      </div>
                    </div>
                  </div>

                  <div className="glass-chip rounded-[1.5rem] border border-white/5 p-5">
                    <div className="space-y-3">
                      <div className="text-[9px] uppercase tracking-[0.26em] text-cyan-300/70">Evidence summary</div>
                      {evidenceSummary.citedSignals.map((signal) => (
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
              {discoveryRoutes.map((route, index) => (
                <div
                  className={`rounded-[1.75rem] border p-5 ${
                    index === 0
                      ? "border-cyan-300/30 bg-cyan-300/10"
                      : "border-white/8 bg-white/[0.03]"
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
                {agencyComparison.map((option) => (
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5" key={option.label}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-headline text-2xl text-white">{option.label}</div>
                      <div className="font-mono text-sm text-cyan-100">{option.fare}</div>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">{option.duration}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-400">{option.note}</div>
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
                <Image alt={vibeMap.alt} className="object-cover" fill sizes="(min-width: 1024px) 35vw, 100vw" src={vibeMap.image} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09111d] via-[#09111d]/15 to-transparent" />

                {vibeMap.tags.map((tag) => (
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

      <BottomHud left="System log: synthesis complete. Gateway ready." signal="94.2%" />
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
