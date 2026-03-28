import { ReactNode } from "react";

type PageShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, subtitle, children }: PageShellProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-7xl flex-col gap-10 px-6 pb-28 pt-10 md:px-10">
      <section className="max-w-3xl space-y-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">{eyebrow}</div>
        <h1 className="font-headline text-5xl leading-none text-white md:text-7xl">{title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-300">{subtitle}</p>
      </section>
      {children}
    </main>
  );
}
