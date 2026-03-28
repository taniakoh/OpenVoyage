import { z } from "zod";

import {
  loadBookingHudPayload,
  type BookingFieldMapping
} from "@/lib/booking-hud";
import {
  runTinyFishAutomation,
  tinyFishEnabled,
  type TinyFishStreamEvent
} from "@/lib/tinyfish";

const startSessionSchema = z.object({
  prompt: z.string().min(1).optional(),
  destination: z.string().min(1),
  operator: z.string().min(1),
  travelerName: z.string().min(1),
  bookingUrl: z.string().url(),
  websocketUrl: z.string().min(1),
  viewportLabel: z.string().min(1),
  fieldMappings: z.array(
    z.object({
      label: z.string().min(1),
      selector: z.string().min(1),
      value: z.string(),
      source: z.string().min(1),
      status: z.enum(["ready", "pending"])
    })
  )
});

const confirmPaymentSchema = z.object({
  action: z.literal("confirm_payment"),
  verificationCode: z.string().regex(/^\d{6}$/),
  operator: z.string().min(1),
  destination: z.string().min(1)
});

const querySchema = z.object({
  prompt: z.string().min(1).optional()
});

const encoder = new TextEncoder();

type SessionEvent = {
  type:
    | "SESSION_READY"
    | "PORTAL_READY"
    | "AUTOMATION_LOG"
    | "FIELD_MAPPED"
    | "VERIFICATION_REQUIRED"
    | "PAYMENT_READY"
    | "COMPLETE"
    | "ERROR";
  message: string;
  progress: number;
  urgency?: "normal" | "high";
  portalUrl?: string;
  selector?: string;
};

function toSse(event: SessionEvent) {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    prompt: searchParams.get("prompt") ?? undefined
  });

  if (!parsedQuery.success) {
    return new Response(JSON.stringify({ error: "Invalid booking-session prompt." }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const payload = await loadBookingHudPayload(parsedQuery.data.prompt);
  return Response.json(payload);
}

export async function POST(request: Request) {
  const body = startSessionSchema.parse(await request.json());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SessionEvent) => controller.enqueue(toSse(event));

      send({
        type: "SESSION_READY",
        message: `Execution lane reserved for ${body.operator}.`,
        progress: 12
      });

      await wait(180);

      send({
        type: "PORTAL_READY",
        message: `Shadow browser portal opened for ${body.destination} at ${body.viewportLabel}.`,
        progress: 24,
        portalUrl: body.websocketUrl
      });

      try {
        if (tinyFishEnabled()) {
          await streamTinyFishSession(body, send);
        } else {
          await streamMockSession(body, send);
        }

        controller.close();
      } catch (error) {
        send({
          type: "ERROR",
          message:
            error instanceof Error
              ? `Booking session failed: ${error.message}`
              : "Booking session failed before reaching the final hand-off gate.",
          progress: 24,
          urgency: "high"
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

export async function PUT(request: Request) {
  const body = confirmPaymentSchema.parse(await request.json());

  await wait(220);

  return Response.json({
    status: "confirmed",
    operator: body.operator,
    destination: body.destination,
    confirmedAt: new Date().toISOString(),
    maskedCode: `${body.verificationCode.slice(0, 2)}****`
  });
}

async function streamMockSession(
  body: z.infer<typeof startSessionSchema>,
  send: (event: SessionEvent) => void
) {
  const readyMappings = body.fieldMappings.filter((field) => field.status === "ready");
  const pendingMappings = body.fieldMappings.filter((field) => field.status === "pending");

  for (const [index, field] of readyMappings.slice(0, 3).entries()) {
    await wait(260);
    send({
      type: "AUTOMATION_LOG",
      message: `Injecting ${field.label} into ${field.selector} from ${field.source}.`,
      progress: 32 + index * 8,
      selector: field.selector
    });
  }

  await wait(220);

  send({
    type: "FIELD_MAPPED",
    message: `Mapped ${readyMappings.length} traveler fields from Supabase into checkout inputs.${
      pendingMappings.length ? ` ${pendingMappings.length} fields still need manual review.` : ""
    }`,
    progress: pendingMappings.length ? 66 : 72,
    selector: readyMappings[0]?.selector
  });

  await wait(240);

  send({
    type: "VERIFICATION_REQUIRED",
    message: `Verification required: ${body.operator} requested an MFA code for ${body.travelerName}.`,
    progress: 82,
    urgency: "high"
  });

  await wait(240);

  send({
    type: "PAYMENT_READY",
    message: "Charge is staged and waiting for traveler confirmation.",
    progress: 94
  });

  await wait(160);

  send({
    type: "COMPLETE",
    message: "Agent has reached the final hand-off gate.",
    progress: 100
  });
}

async function streamTinyFishSession(
  body: z.infer<typeof startSessionSchema>,
  send: (event: SessionEvent) => void
) {
  let progress = 32;
  let logCount = 0;

  const result = await runTinyFishAutomation(
    {
      url: body.bookingUrl,
      goal: buildBookingGoal(body.fieldMappings, body.travelerName)
    },
    {
      onEvent(event) {
        const sessionEvent = toAutomationLog(event, progress);
        if (sessionEvent) {
          send(sessionEvent);
          logCount += 1;
          progress = Math.min(68, progress + 6);
        }
      }
    }
  );

  const readyMappings = body.fieldMappings.filter((field) => field.status === "ready");
  const pendingMappings = body.fieldMappings.filter((field) => field.status === "pending");
  const resultSummary = summariseTinyFishResult(result.events[result.events.length - 1], body.fieldMappings);

  send({
    type: "FIELD_MAPPED",
    message: `TinyFish completed ${logCount || 1} automation steps. ${resultSummary}${
      pendingMappings.length ? ` ${pendingMappings.length} fields still need manual review.` : ""
    }`,
    progress: readyMappings.length ? 74 : 68,
    selector: readyMappings[0]?.selector
  });

  await wait(200);

  send({
    type: "VERIFICATION_REQUIRED",
    message: `Verification required: ${body.operator} surfaced a protected challenge for ${body.travelerName}.`,
    progress: 86,
    urgency: "high"
  });

  await wait(180);

  send({
    type: "PAYMENT_READY",
    message: "Checkout is filled and paused on the final confirm-payment click.",
    progress: 96
  });

  await wait(120);

  send({
    type: "COMPLETE",
    message: "Live booking session is synced and waiting for the traveler hand-off.",
    progress: 100
  });
}

function buildBookingGoal(fieldMappings: BookingFieldMapping[], travelerName: string) {
  const selectorPlan = fieldMappings
    .filter((field) => field.status === "ready")
    .map((field) => `${field.selector} <= ${field.value || "[empty]"}`)
    .join("; ");

  return [
    `Open the booking page and prepare checkout for ${travelerName}.`,
    "Use the traveler profile to fill available form fields without submitting payment.",
    `Field plan: ${selectorPlan || "No ready fields were provided."}`,
    "Stop if the site requests OTP, verification, captcha, or payment confirmation.",
    'Return JSON with this exact shape: {"status":"ready_for_mfa"|"needs_review","visible_step":string,"notes":[string]}.'
  ].join(" ");
}

function toAutomationLog(event: TinyFishStreamEvent, progress: number): SessionEvent | null {
  if (event.type === "COMPLETE") {
    return null;
  }

  return {
    type: "AUTOMATION_LOG",
    message: event.message || `TinyFish emitted ${event.type}.`,
    progress,
    urgency: /error|fail|blocked/i.test(event.message || "") ? "high" : "normal"
  };
}

function summariseTinyFishResult(
  finalEvent: TinyFishStreamEvent | undefined,
  fieldMappings: BookingFieldMapping[]
) {
  const payload = finalEvent?.resultJson ?? finalEvent?.result;

  if (payload && typeof payload === "object" && "visible_step" in payload) {
    const visibleStep = payload.visible_step;
    if (typeof visibleStep === "string" && visibleStep.trim()) {
      return `Automation reached "${visibleStep.trim()}".`;
    }
  }

  return `Prepared ${fieldMappings.filter((field) => field.status === "ready").length} field mappings for checkout.`;
}
