"use client";

import { useState } from "react";

import { GlassCard } from "@/components/cards";
import { PageShell } from "@/components/layout/page-shell";
import { bookingFields } from "@/lib/open-voyage-data";

export default function BookingHudPage() {
  const [mfaCode, setMfaCode] = useState(["4", "2", "8", ""]);

  return (
    <PageShell
      eyebrow="Execution Portal // Phase 4"
      title="Booking HUD"
      subtitle="The imported execution screen is turned into a real starting point for agent-assisted booking, with explicit human confirmation and an MFA interruption path."
    >
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <GlassCard className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Execution node</div>
              <h2 className="mt-3 font-headline text-4xl text-white">Secure travel checkout</h2>
            </div>
            <div className="glass-chip rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200">
              Human confirm required
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {bookingFields.map((field) => (
              <label className="space-y-2" key={field.label}>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">{field.label}</span>
                <input
                  className="w-full rounded-2xl border border-cyan-300/10 bg-slate-950/35 px-4 py-4 text-lg text-slate-100 outline-none focus:border-cyan-300/40"
                  defaultValue={field.value}
                />
              </label>
            ))}
          </div>
        </GlassCard>
        <div className="grid gap-6">
          <GlassCard className="text-center">
            <div className="space-y-4">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-cyan-300/30">
                <div className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">65% synced</div>
              </div>
              <h3 className="font-headline text-3xl text-white">Ready for jump</h3>
              <p className="text-sm text-slate-300">Wire this panel to the active TinyFish booking session once agent execution is enabled.</p>
              <button className="w-full rounded-full bg-cyan-300 px-5 py-4 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-slate-950">
                Initialize booking
              </button>
            </div>
          </GlassCard>
          <GlassCard className="scanline relative overflow-hidden">
            <div className="relative space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">MFA bridge</div>
              <p className="text-sm leading-relaxed text-slate-300">
                This mirrors the requirement that checkout pauses for user-provided verification before any sensitive step continues.
              </p>
              <div className="grid grid-cols-4 gap-3">
                {mfaCode.map((digit, index) => (
                  <input
                    className="h-14 rounded-2xl border border-cyan-300/20 bg-slate-950/40 text-center font-mono text-2xl text-cyan-200 outline-none"
                    key={`${index}-${digit}`}
                    maxLength={1}
                    onChange={(event) => {
                      const next = [...mfaCode];
                      next[index] = event.target.value.slice(0, 1);
                      setMfaCode(next);
                    }}
                    value={digit}
                  />
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </PageShell>
  );
}
