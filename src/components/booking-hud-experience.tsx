"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BottomHud, GlassPanel, ScenicBackdrop, TopBar } from "@/components/cinematic-ui";
import { type BookingFieldMapping, type BookingHudPayload } from "@/lib/booking-hud";

type SessionLog = {
  type: string;
  message: string;
  progress: number;
  urgency?: "normal" | "high";
  portalUrl?: string;
  selector?: string;
};

type SessionState = "idle" | "running" | "mfa" | "payment-ready" | "confirmed";

export function BookingHudExperience({ payload, prompt }: { payload: BookingHudPayload; prompt?: string }) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [portalOpen, setPortalOpen] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState(12);
  const [portalUrl, setPortalUrl] = useState<string>(payload.portal.websocketUrl);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SessionLog[]>([
    {
      type: "BOOT",
      message: "Execution portal staged. Waiting for the traveler to initialize the booking lane.",
      progress: 12,
      portalUrl: payload.portal.websocketUrl
    }
  ]);
  const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);

  const allDigitsFilled = mfaCode.every((digit) => digit.length === 1);
  const currentSignal = `${Math.max(progress, confirmed ? 100 : progress).toFixed(1)}%`;
  const readyMappings = payload.fieldMappings.filter((field) => field.status === "ready");
  const pendingMappings = payload.fieldMappings.filter((field) => field.status === "pending");

  const liveBadge = useMemo(() => {
    if (confirmed) {
      return "Payment Released";
    }

    if (sessionState === "mfa") {
      return "Verification Required";
    }

    if (sessionState === "payment-ready") {
      return "Ready for Hand-off";
    }

    if (sessionState === "running") {
      return "Agent Active";
    }

    return "Standing By";
  }, [confirmed, sessionState]);

  async function initializeBooking() {
    if (sessionState === "running" || confirmed) {
      setPortalOpen(true);
      return;
    }

    setSessionState("running");
    setPortalOpen(true);
    setSessionError(null);
    setLogs((current) => current.slice(0, 1));
    setProgress(18);

    const response = await fetch("/api/booking-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        destination: payload.route.destination,
        operator: payload.route.operator,
        travelerName: payload.traveler.fullName,
        bookingUrl: payload.route.bookingUrl,
        websocketUrl: payload.portal.websocketUrl,
        viewportLabel: payload.portal.viewportLabel,
        fieldMappings: payload.fieldMappings
      })
    });

    if (!response.ok || !response.body) {
      const message = "Unable to open the shadow browser stream from the booking session route.";
      setLogs((current) => [
        ...current,
        {
          type: "ERROR",
          message,
          progress
        }
      ]);
      setSessionError(message);
      setSessionState("idle");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) {
          continue;
        }

        const event = JSON.parse(line.slice(6)) as SessionLog;
        setLogs((current) => [...current, event]);
        setProgress(event.progress);

        if (event.portalUrl) {
          setPortalUrl(event.portalUrl);
        }

        if (event.type === "VERIFICATION_REQUIRED") {
          setSessionState("mfa");
          setMfaOpen(true);
        }

        if (event.type === "PAYMENT_READY" || event.type === "COMPLETE") {
          setSessionState("payment-ready");
        }

        if (event.type === "ERROR") {
          setSessionError(event.message);
          setSessionState("idle");
        }
      }
    }
  }

  async function confirmPayment() {
    if (!allDigitsFilled) {
      setMfaOpen(true);
      setSessionError("Enter the full 6-digit verification code before releasing payment.");
      return;
    }

    setConfirming(true);
    setSessionError(null);

    try {
      const response = await fetch("/api/booking-session", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "confirm_payment",
          verificationCode: mfaCode.join(""),
          operator: payload.route.operator,
          destination: payload.route.destination
        })
      });

      if (!response.ok) {
        throw new Error("The server did not accept the payment release.");
      }

      const result = (await response.json()) as { maskedCode: string };
      setConfirming(false);
      setConfirmed(true);
      setMfaOpen(false);
      setSessionState("confirmed");
      setProgress(100);
      setLogs((current) => [
        ...current,
        {
          type: "FINAL_CLICK",
          message: `Final payment hand-off released with verification token ${result.maskedCode}. Agent click authorized by traveler.`,
          progress: 100
        }
      ]);
    } catch (error) {
      setConfirming(false);
      setSessionError(error instanceof Error ? error.message : "Confirm payment failed.");
      setMfaOpen(true);
    }
  }

  return (
    <>
      <ScenicBackdrop />
      <TopBar active="settings" showSearch glass />

      <main className="relative px-5 pb-28 pt-32 md:px-12 lg:px-20">
        <section className="mx-auto grid max-w-[1220px] gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <GlassPanel className="p-8 md:p-10">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">
                    Execution Portal // Live Checkout
                  </div>
                  <h1 className="mt-3 font-headline text-5xl font-light text-white">Booking HUD</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                    OpenVoyage fills the operator checkout for you, shows the live session state, and stops only when the site requires your verification.
                  </p>
                </div>
                <div className="glass-chip rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-[#ffd1c4]">
                  {liveBadge}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <StatCard label="Destination" value={payload.route.destination} />
                <StatCard label="Departure" value={payload.route.departureWindow} />
                <StatCard label="Fare Hold" value={payload.route.fareHold} />
                <StatCard label="Operator" value={payload.route.operator} />
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/70">
                        Booking summary
                      </div>
                      <h2 className="mt-3 font-headline text-3xl text-white">{payload.route.operator}</h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-slate-300">
                      Traveler profile loaded
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <ProfileTile label="Passenger" value={payload.traveler.fullName} />
                    <ProfileTile label="Email" value={payload.traveler.email} />
                    <ProfileTile label="Phone" value={payload.traveler.phone} />
                    <ProfileTile label="Passport" value={payload.traveler.passportNumber} />
                  </div>

                  <div className="mt-6 rounded-[1.35rem] border border-cyan-300/10 bg-cyan-300/5 p-4">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-cyan-300/80">Checkout target</div>
                    <div className="mt-2 break-all font-mono text-xs text-slate-200">{payload.route.bookingUrl}</div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-[#07111f]/70 p-5">
                  <div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/70">Execution Progress</div>
                  <div className="mt-4 space-y-4">
                    {payload.liveSteps.map((step) => (
                      <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4" key={step.title}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-white">{step.title}</div>
                            <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.detail}</p>
                          </div>
                          <span
                            className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${
                              step.status === "complete"
                                ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.7)]"
                                : step.status === "active"
                                  ? "bg-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]"
                                  : "bg-white/20"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Form Injection</div>
                  <h2 className="mt-3 font-headline text-3xl text-white">Profile Mapping Lane</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-slate-300">
                  {readyMappings.length} ready / {pendingMappings.length} pending
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {payload.fieldMappings.map((field) => (
                  <FieldMappingCard key={field.label} mapping={field} />
                ))}
              </div>
            </GlassPanel>
          </div>

          <div className="grid gap-6">
            <GlassPanel className="p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Shadow Browser Portal</div>
                  <h2 className="mt-3 font-headline text-3xl text-white">Live Agent Feed</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-slate-300">
                  {currentSignal}
                </div>
              </div>

              <div className="mt-6 rounded-[1.8rem] border border-cyan-300/12 bg-[#040913]/85 p-4 shadow-[inset_0_0_0_1px_rgba(0,229,255,0.08)]">
                <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.24em] text-slate-500">
                  <span>VNC / Websocket viewport</span>
                  <span>{portalUrl}</span>
                </div>

                <div className="booking-portal-grid mt-4 h-[268px] rounded-[1.4rem] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.08),transparent_42%),linear-gradient(180deg,rgba(8,14,26,0.98),rgba(4,9,19,0.96))] p-4">
                  <div className="booking-portal-window rounded-[1.1rem] border border-cyan-300/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-cyan-200">{payload.portal.viewportLabel}</span>
                      <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-cyan-300">
                        Live
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      <PortalField label="Passenger" value={payload.traveler.fullName} />
                      <PortalField label="Departure" value={payload.route.departureWindow} />
                      <PortalField label="Status" value={liveBadge} accent />
                    </div>
                  </div>
                  <div className="booking-portal-typing rounded-full bg-cyan-300/16" />
                  <div className="booking-portal-typing delay-1 rounded-full bg-cyan-300/28" />
                  <div className="booking-portal-typing delay-2 rounded-full bg-[#ffb4a3]/32" />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="teal-button flex-1 rounded-full px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.3em]"
                  onClick={initializeBooking}
                  type="button"
                >
                  {sessionState === "idle" ? "Start booking" : "Resume live session"}
                </button>
                <button
                  className="ghost-button rounded-full px-5 py-4 text-[10px] uppercase tracking-[0.3em] text-white"
                  onClick={() => setPortalOpen(true)}
                  type="button"
                >
                  Expand
                </button>
              </div>

              <Link
                className="ghost-button mt-4 block rounded-full px-5 py-4 text-center text-[10px] uppercase tracking-[0.3em] text-cyan-300"
                href={payload.route.bookingUrl}
                target="_blank"
              >
                Open operator checkout
              </Link>
            </GlassPanel>

            <GlassPanel className="p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Agent Logs</div>
                  <h2 className="mt-3 font-headline text-3xl text-white">Execution Trace</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-slate-300">
                  JetBrains Mono
                </div>
              </div>

              <div className="mt-6 space-y-3 font-mono text-[11px]">
                {logs.slice(-6).map((log, index) => (
                  <div
                    className={`rounded-[1.2rem] border px-4 py-3 ${
                      log.urgency === "high"
                        ? "border-[#ffb4a3]/28 bg-[#ffb4a3]/10 text-[#ffe3dc]"
                        : "border-white/8 bg-slate-950/32 text-cyan-100"
                    }`}
                    key={`${log.type}-${log.message}-${index}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{log.type}</span>
                      <span className="text-slate-500">{log.progress}%</span>
                    </div>
                    <p className="mt-2 leading-relaxed text-slate-300">{log.message}</p>
                    {log.selector ? <div className="mt-2 text-[10px] text-slate-500">{log.selector}</div> : null}
                  </div>
                ))}
              </div>

              {sessionError ? <p className="mt-5 text-sm text-rose-200">{sessionError}</p> : null}

              <Link
                className="ghost-button mt-6 block rounded-full px-5 py-4 text-center text-[10px] uppercase tracking-[0.3em] text-cyan-300"
                href="/mission-control"
              >
                Preview post-booking sentry
              </Link>
            </GlassPanel>

            <GlassPanel className="border border-[#ffb4a3]/15 bg-[linear-gradient(180deg,rgba(255,180,163,0.14),rgba(13,19,33,0.36))] p-7">
              <div className="text-[9px] uppercase tracking-[0.32em] text-[#ffd3c9]">MFA Bridge</div>
              <h2 className="mt-3 font-headline text-3xl text-[#fff3ef]">Traveler Verification</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#ffe3dc]">
                {payload.mfaHint} The agent pauses here until you enter the SMS code and release the final checkout step.
              </p>
              <button
                className="mt-6 w-full rounded-full bg-[#ffb4a3] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#4b1f18] shadow-[0_0_28px_rgba(255,180,163,0.28)]"
                onClick={() => setMfaOpen(true)}
                type="button"
              >
                Enter verification code
              </button>
            </GlassPanel>
          </div>
        </section>
      </main>

      {portalOpen ? (
        <PortalModal
          confirmed={confirmed}
          logs={logs}
          onClose={() => setPortalOpen(false)}
          portalTarget={payload.route.bookingUrl}
          portalUrl={portalUrl}
          progress={progress}
          state={sessionState}
          viewportLabel={payload.portal.viewportLabel}
        />
      ) : null}

      {mfaOpen ? (
        <MfaModal
          code={mfaCode}
          confirming={confirming}
          onChange={(index, value) => {
            setMfaCode((current) => {
              const next = [...current];
              next[index] = value.replace(/\D/g, "").slice(0, 1);
              return next;
            });
          }}
          onClose={() => setMfaOpen(false)}
          onConfirm={confirmPayment}
        />
      ) : null}

      <BottomHud
        center={
          <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] uppercase tracking-[0.24em] text-cyan-300">
            {liveBadge}
          </span>
        }
        left={
          confirmed
            ? "Traveler confirmed payment. Booking completed and saved."
            : "Live booking is ready. The agent will pause before the final payment click."
        }
        signal={currentSignal}
      />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-3 text-sm text-white">{value}</div>
    </div>
  );
}

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  );
}

function FieldMappingCard({ mapping }: { mapping: BookingFieldMapping }) {
  const chipClass =
    mapping.status === "ready"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
      : "border-[#ffb4a3]/20 bg-[#ffb4a3]/10 text-[#ffe3dc]";

  return (
    <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-white">{mapping.label}</div>
          <div className="mt-2 font-mono text-[11px] text-cyan-200">{mapping.selector}</div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[9px] uppercase tracking-[0.2em] ${chipClass}`}>
          {mapping.status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Resolved value</div>
          <div className="mt-2 break-all text-sm text-slate-200">{mapping.value || "No value resolved yet"}</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{mapping.source}</div>
      </div>
    </div>
  );
}

function PortalField({
  label,
  value,
  accent = false
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[1rem] border border-white/6 bg-slate-950/40 px-3 py-3">
      <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className={`mt-2 text-sm ${accent ? "text-cyan-300" : "text-white"}`}>{value}</div>
    </div>
  );
}

function PortalModal({
  logs,
  onClose,
  portalUrl,
  portalTarget,
  progress,
  state,
  confirmed,
  viewportLabel
}: {
  logs: SessionLog[];
  onClose: () => void;
  portalUrl: string;
  portalTarget: string;
  progress: number;
  state: SessionState;
  confirmed: boolean;
  viewportLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020611]/82 px-4 backdrop-blur-xl">
      <div className="glass-panel glass-edge relative w-full max-w-5xl rounded-[2.2rem] p-6 md:p-8">
        <button
          className="absolute right-5 top-5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-slate-300"
          onClick={onClose}
          type="button"
        >
          Close
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Shadow Browser Portal</div>
            <h2 className="mt-3 font-headline text-4xl text-white">Live Remote Session</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              This portal is now wired to the booking-session stream and displays the live target, session progress, and traveler stop points for the final payment release.
            </p>

            <div className="mt-6 rounded-[1.8rem] border border-cyan-300/12 bg-[#04101d] p-5">
              <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.24em] text-slate-500">
                <span>Remote target</span>
                <span className="font-mono text-cyan-300">{portalUrl}</span>
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">{portalTarget}</div>
              <div className="mt-5 h-[320px] rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(6,11,22,0.98),rgba(4,9,19,0.94))] p-5">
                <div className="grid h-full grid-rows-[auto_1fr_auto] gap-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                      {state === "mfa" ? "Paused for MFA" : confirmed ? "Released" : "Live playback"}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{progress}% complete</span>
                  </div>
                  <div className="grid place-items-center rounded-[1.2rem] border border-cyan-300/8 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.09),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
                    <div className="space-y-4 text-center">
                      <div className="mx-auto h-24 w-24 rounded-full border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_44px_rgba(0,229,255,0.18)]" />
                      <div className="text-sm text-slate-300">
                        {viewportLabel} is staged for traveler-visible typing, selector focus, and confirmation gating.
                      </div>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-cyan-300 shadow-[0_0_16px_rgba(0,229,255,0.8)]" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {logs.slice(-5).map((log, index) => (
              <div
                className={`rounded-[1.4rem] border p-4 ${
                  log.urgency === "high"
                    ? "border-[#ffb4a3]/28 bg-[#ffb4a3]/10"
                    : "border-white/8 bg-white/[0.04]"
                }`}
                key={`${log.type}-${index}`}
              >
                <div className="text-[9px] uppercase tracking-[0.24em] text-slate-500">{log.type}</div>
                <p className="mt-2 text-sm leading-relaxed text-white">{log.message}</p>
                {log.selector ? <p className="mt-2 font-mono text-[11px] text-cyan-200">{log.selector}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MfaModal({
  code,
  confirming,
  onChange,
  onClose,
  onConfirm
}: {
  code: string[];
  confirming: boolean;
  onChange: (index: number, value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2d0d08]/58 px-4 backdrop-blur-xl">
      <div className="relative w-full max-w-xl rounded-[2rem] border border-[#ffb4a3]/25 bg-[linear-gradient(180deg,rgba(65,21,14,0.94),rgba(21,11,18,0.98))] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <button
          className="absolute right-5 top-5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-[#ffe3dc]"
          onClick={onClose}
          type="button"
        >
          Close
        </button>

        <div className="text-[9px] uppercase tracking-[0.32em] text-[#ffd3c9]">Verification Required</div>
        <h2 className="mt-3 font-headline text-4xl text-[#fff5f1]">MFA Bridge</h2>
        <p className="mt-4 text-sm leading-relaxed text-[#ffe3dc]">
          The agent has encountered a protected verification screen. Enter the code from the operator and explicitly release the confirm-payment action.
        </p>

        <div className="mt-6 grid grid-cols-6 gap-3">
          {code.map((digit, index) => (
            <input
              className="h-14 rounded-[1.2rem] border border-[#ffb4a3]/30 bg-[#180b0c] text-center font-mono text-2xl text-[#fff3ef] outline-none focus:border-[#ffd3c9]"
              inputMode="numeric"
              key={`${digit}-${index}`}
              maxLength={1}
              onChange={(event) => onChange(index, event.target.value)}
              value={digit}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-full bg-[#ffb4a3] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#4b1f18] shadow-[0_0_28px_rgba(255,180,163,0.28)]"
            onClick={onConfirm}
            type="button"
          >
            {confirming ? "Releasing..." : "Confirm Payment"}
          </button>
          <button
            className="rounded-full border border-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.3em] text-[#ffe3dc]"
            onClick={onClose}
            type="button"
          >
            Hold Agent
          </button>
        </div>
      </div>
    </div>
  );
}
