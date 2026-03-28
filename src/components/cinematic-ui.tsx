"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type IconName =
  | "account"
  | "analytics"
  | "arrow"
  | "bed"
  | "bike"
  | "check"
  | "dot"
  | "explore"
  | "flight"
  | "forum"
  | "refresh"
  | "search"
  | "sensors"
  | "share"
  | "spark"
  | "terminal"
  | "warning";

type NavMode = "explore" | "history" | "settings";

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const base = `h-5 w-5 ${className}`;

  switch (name) {
    case "account":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 18c1.6-2.2 7.4-2.2 9 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case "analytics":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="M5 18V9m7 9V5m7 13v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
          <circle cx="5" cy="8" r="1.25" fill="currentColor" />
          <circle cx="12" cy="4" r="1.25" fill="currentColor" />
          <circle cx="19" cy="10" r="1.25" fill="currentColor" />
        </svg>
      );
    case "arrow":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "bed":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="M4 18v-7h16v7M6.5 11V8.5A1.5 1.5 0 0 1 8 7h3a1.5 1.5 0 0 1 1.5 1.5V11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="M13 11h5a2 2 0 0 1 2 2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
    case "bike":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <circle cx="7" cy="17" r="3.25" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="18" cy="17" r="3.25" stroke="currentColor" strokeWidth="1.6" />
          <path d="m10 7 2 4h4l-2-4h3M10 7H7m5 4-2 6m0 0 4-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      );
    case "check":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="m8.5 12.5 2.2 2.2 4.8-5.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      );
    case "dot":
      return (
        <svg className={base} viewBox="0 0 24 24">
          <circle cx="12" cy="12" fill="currentColor" r="4" />
        </svg>
      );
    case "explore":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="m15.8 8.2-2.5 7-7.1 2.4 2.5-6.9 7.1-2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "flight":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="m3 13 7.5-.5L18 5l2 2-5.3 7.7L15 22l-2.2-1.8-1.5-4.1L5 17Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "forum":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H17a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H11l-4.5 3v-3H7.5A2.5 2.5 0 0 1 5 11.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "refresh":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="M19 7v5h-5M5 17v-5h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
          <path d="M18 12a6 6 0 0 0-10.3-4.2L5 10m14 4-2.7 2.2A6 6 0 0 1 6 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      );
    case "search":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m15 15 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        </svg>
      );
    case "sensors":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
          <path d="M8 8a5.7 5.7 0 0 0 0 8m8-8a5.7 5.7 0 0 1 0 8M5.2 5.2a9.7 9.7 0 0 0 0 13.6m13.6-13.6a9.7 9.7 0 0 1 0 13.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case "share":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="m8 11 8-3m-8 5 8 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      );
    case "spark":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      );
    case "terminal":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="m5 8 4 4-4 4m6 0h8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
      );
    case "warning":
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24">
          <path d="M12 4 4.5 19h15Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M12 9v4.5m0 3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
      );
  }
}

export function ScenicBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        alt=""
        className="object-cover opacity-45 mix-blend-screen"
        fill
        priority
        sizes="100vw"
        src="/stitch/mountain-horizon.jpg"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(127,216,255,0.18),transparent_30%),linear-gradient(180deg,rgba(7,11,24,0.12)_0%,rgba(7,11,24,0.3)_40%,rgba(5,11,24,0.92)_100%)]" />
    </div>
  );
}

export function TopBar({
  active,
  showSearch = false,
  glass = false
}: {
  active: NavMode;
  showSearch?: boolean;
  glass?: boolean;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Explore", key: "explore" },
    { href: "/mission-control", label: "History", key: "history" },
    { href: "/booking-hud", label: "Settings", key: "settings" }
  ] as const;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 px-4 py-5 md:px-10 ${
        glass ? "backdrop-blur-2xl" : "backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center justify-between gap-6">
        <Link className="font-headline text-[1.35rem] italic tracking-tight text-white" href="/">
          OpenVoyage
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((link) => {
            const isActive = active === link.key || pathname === link.href;

            return (
              <Link
                key={link.href}
                className={`font-headline text-sm tracking-wide transition-colors ${
                  isActive ? "border-b border-cyan-300/40 pb-1 text-white" : "text-slate-400 hover:text-white"
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {showSearch ? (
            <label className="hidden items-center gap-3 rounded-full bg-slate-950/30 px-5 py-2.5 text-slate-400 backdrop-blur-xl md:flex">
              <Icon className="h-4 w-4 text-cyan-300/55" name="search" />
              <input
                className="w-44 bg-transparent text-[12px] outline-none placeholder:text-slate-500"
                placeholder="Scan coordinates..."
                readOnly
              />
            </label>
          ) : null}

          <button
            aria-label="Account"
            className="rounded-full p-1 text-cyan-300 transition-transform hover:scale-105"
            type="button"
          >
            <Icon className="h-6 w-6" name="account" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomHud({
  left,
  signal = "98.4%",
  center
}: {
  left: string;
  signal?: string;
  center?: ReactNode;
}) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#050b18]/80 backdrop-blur-2xl">
      <div className="flex h-12 items-center justify-between gap-4 px-4 text-[9px] uppercase tracking-[0.28em] text-slate-500 md:px-10">
        <div className="flex min-w-0 items-center gap-2 text-cyan-300/80">
          <Icon className="h-4 w-4 shrink-0" name="terminal" />
          <span className="truncate">{left}</span>
        </div>

        {center ? <div className="hidden items-center gap-3 md:flex">{center}</div> : <div />}

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-cyan-300 md:flex">
            <Icon className="h-4 w-4 sentry-pulse" name="sensors" />
            <span>Signal: {signal}</span>
          </div>
          <span>V.2.0.4-BETA</span>
        </div>
      </div>
    </footer>
  );
}

export function GlassPanel({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-panel glass-edge rounded-[2rem] ${className}`}>{children}</div>;
}

export function SideOrbitDock() {
  const items: { icon: IconName; label: string; active?: boolean }[] = [
    { icon: "forum", label: "Reddit", active: true },
    { icon: "share", label: "Signals" },
    { icon: "bike", label: "Ferry" },
    { icon: "flight", label: "Flights" },
    { icon: "bed", label: "Stays" }
  ];

  return (
    <aside className="fixed left-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-6 rounded-[2rem] bg-slate-950/30 px-3 py-6 backdrop-blur-[40px] md:flex">
      <div className="rounded-full bg-cyan-300/10 p-2 text-cyan-300">
        <Icon className="h-4 w-4" name="spark" />
      </div>

      {items.map((item) => (
        <div className="group relative" key={item.label}>
          <div
            className={`rounded-full p-3 transition-colors ${
              item.active
                ? "bg-cyan-300/15 text-cyan-300 shadow-[0_0_25px_rgba(0,229,255,0.25)]"
                : "text-slate-400 hover:bg-cyan-300/10 hover:text-cyan-300"
            }`}
          >
            <Icon className="h-4 w-4" name={item.icon} />
          </div>
          <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 rounded bg-slate-900/85 px-2 py-1 text-[9px] uppercase tracking-[0.24em] text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
            {item.label}
          </span>
        </div>
      ))}

      <div className="mt-1 flex flex-col items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
        <span className="origin-center rotate-90 text-[8px] uppercase tracking-[0.32em] text-cyan-300">
          Active
        </span>
      </div>
    </aside>
  );
}

export function FloatingTrace() {
  const nodes = ["R/", "X", "K"];

  return (
    <div className="pointer-events-none fixed right-6 top-36 z-20 hidden flex-col gap-12 lg:flex">
      {nodes.map((node, index) => (
        <div
          className={`flex items-center gap-4 ${index === 1 ? "translate-x-8" : index === 2 ? "-translate-x-8" : ""}`}
          key={node}
        >
          <div
            className="floating-node flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-mono text-cyan-300"
            style={{ animationDelay: `${index * 0.8}s` }}
          >
            {node}
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-cyan-300/35 to-transparent" />
        </div>
      ))}
    </div>
  );
}

