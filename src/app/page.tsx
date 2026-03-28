import Link from "next/link";

import { GlassCard } from "@/components/cards";
import { PageShell } from "@/components/layout/page-shell";
import { gatewayPrompts } from "@/lib/open-voyage-data";
import { createClient } from "@/utils/supabase/server";

export default async function GatewayPage() {
  const supabase = await createClient();
  const { data: todos, error } = await supabase.from("todos").select("id, name").limit(5);

  return (
    <PageShell
      eyebrow="Intent Canvas // Phase 1"
      title="Where should OpenVoyage scout next?"
      subtitle="This gateway converts the imported Stitch concept into a real App Router entry point. It frames the journey around intent parsing, parallel scouts, and live verification instead of static placeholder copy."
    >
      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <GlassCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.14),transparent_40%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-cyan-400/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 aurora-dot" />
              Prompt to structured travel intent
            </div>
            <h2 className="max-w-2xl font-headline text-4xl text-white md:text-6xl">
              Describe your route in natural language. We split it into agents, sources, and verification lanes.
            </h2>
            <div className="rounded-[24px] border border-cyan-300/10 bg-slate-950/35 p-4">
              <textarea
                className="min-h-40 w-full resize-none bg-transparent text-lg text-slate-100 outline-none placeholder:text-slate-500"
                defaultValue="Find me the quietest Batam ferry from Singapore tomorrow morning, keep it affordable, and verify checkpoint conditions with Reddit and local news."
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">
                  Next step: POST `/api/search`
                </div>
                <Link
                  className="rounded-full bg-cyan-300 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-slate-950 transition hover:scale-[1.02]"
                  href="/signal-stream"
                >
                  Start scouting
                </Link>
              </div>
            </div>
          </div>
        </GlassCard>
        <div className="grid gap-6">
          {gatewayPrompts.map((prompt) => (
            <GlassCard key={prompt.title}>
              <div className="space-y-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Prompt seed</div>
                <h3 className="font-headline text-3xl text-white">{prompt.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{prompt.body}</p>
              </div>
            </GlassCard>
          ))}

          <GlassCard>
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">
                Supabase live read
              </div>
              <h3 className="font-headline text-3xl text-white">Recent todos</h3>
              {error ? (
                <p className="text-sm leading-relaxed text-rose-200">
                  Supabase is connected, but the `todos` query failed: {error.message}
                </p>
              ) : todos?.length ? (
                <ul className="space-y-2 text-sm leading-relaxed text-slate-200">
                  {todos.map((todo) => (
                    <li
                      key={todo.id}
                      className="rounded-2xl border border-cyan-300/10 bg-slate-950/35 px-4 py-3"
                    >
                      {todo.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-slate-300">
                  No `todos` rows yet. Add some records in Supabase to see them here.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </section>
    </PageShell>
  );
}
