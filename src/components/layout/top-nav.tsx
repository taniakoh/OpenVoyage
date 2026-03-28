"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { href: "/", label: "Gateway" },
  { href: "/signal-stream", label: "Signal Stream" },
  { href: "/mission-control", label: "Mission Control" },
  { href: "/discovery-report", label: "Discovery Report" },
  { href: "/booking-hud", label: "Booking HUD" }
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const activeRoute = routes.find((route) => isActiveRoute(pathname, route.href));

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-400/10 bg-slate-950/45 backdrop-blur-3xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <Link className="font-headline text-2xl tracking-tight text-cyan-300 text-glow" href="/">
          OpenVoyage
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {routes.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={`font-headline text-lg transition-colors ${
                  active ? "border-b border-cyan-300 pb-1 text-cyan-200" : "text-slate-400 hover:text-cyan-100"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="glass-chip rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300">
          {activeRoute?.label ?? "OpenVoyage"}
        </div>
      </div>
    </header>
  );
}
