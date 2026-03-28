export function StatusBar() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-400/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-slate-400 md:px-10">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-cyan-300 aurora-dot" />
          <span>Thinking Trace Ready</span>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <span>TinyFish Proxy Prepared</span>
          <span>Human Confirmation Preserved</span>
        </div>
      </div>
    </footer>
  );
}
