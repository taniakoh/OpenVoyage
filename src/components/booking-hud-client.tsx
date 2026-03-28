"use client";

import { useEffect, useState } from "react";

import { BookingHudExperience } from "@/components/booking-hud-experience";
import { BottomHud, GlassPanel, ScenicBackdrop, TopBar } from "@/components/cinematic-ui";
import type { BookingHudPayload } from "@/lib/booking-hud";
import { defaultGatewayPrompt } from "@/lib/open-voyage-data";

export function BookingHudClient({ prompt = defaultGatewayPrompt }: { prompt?: string }) {
  const [payload, setPayload] = useState<BookingHudPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPayload = async () => {
      try {
        const response = await fetch(`/api/booking-session?prompt=${encodeURIComponent(prompt)}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Booking HUD payload failed to load.");
        }

        const nextPayload = (await response.json()) as BookingHudPayload;

        if (isMounted) {
          setPayload(nextPayload);
          setError(null);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Booking HUD payload failed to load.");
        }
      }
    };

    void loadPayload();

    return () => {
      isMounted = false;
    };
  }, [prompt]);

  if (payload) {
    return <BookingHudExperience payload={payload} prompt={prompt} />;
  }

  return (
    <>
      <ScenicBackdrop />
      <TopBar active="settings" showSearch glass />
      <main className="relative px-5 pb-28 pt-32 md:px-12 lg:px-20">
        <section className="mx-auto max-w-[960px]">
          <GlassPanel className="p-8 md:p-10">
            <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Loading Booking Lane</div>
            <h1 className="mt-3 font-headline text-5xl font-light text-white">Booking HUD</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
              Fetching the live booking payload from the route API so the execution HUD matches the selected search result.
            </p>
            {error ? <p className="mt-6 text-sm text-rose-200">{error}</p> : null}
          </GlassPanel>
        </section>
      </main>
      <BottomHud left="Preparing live booking payload." signal="--" />
    </>
  );
}
