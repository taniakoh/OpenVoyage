import { z } from "zod";

const bodySchema = z.object({
  destination: z.string().min(1),
  operator: z.string().min(1),
  travelerName: z.string().min(1),
  fieldCount: z.number().int().nonnegative()
});

const encoder = new TextEncoder();

type SessionEvent = {
  type:
    | "SESSION_READY"
    | "PORTAL_READY"
    | "FIELD_MAPPED"
    | "VERIFICATION_REQUIRED"
    | "PAYMENT_READY"
    | "COMPLETE";
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

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const events: SessionEvent[] = [
        {
          type: "SESSION_READY",
          message: `Execution lane reserved for ${body.operator}.`,
          progress: 14
        },
        {
          type: "PORTAL_READY",
          message: `Shadow browser portal opened for ${body.destination}.`,
          progress: 28,
          portalUrl: "wss://demo.openvoyage.local/shadow-browser"
        },
        {
          type: "FIELD_MAPPED",
          message: `Mapped ${body.fieldCount} traveler fields from Supabase into checkout inputs.`,
          progress: 52,
          selector: "form.checkout"
        },
        {
          type: "VERIFICATION_REQUIRED",
          message: `Verification required: operator requested an MFA code for ${body.travelerName}.`,
          progress: 74,
          urgency: "high"
        },
        {
          type: "PAYMENT_READY",
          message: "Charge is staged and waiting for traveler confirmation.",
          progress: 92
        },
        {
          type: "COMPLETE",
          message: "Agent has reached the final hand-off gate.",
          progress: 100
        }
      ];

      for (const event of events) {
        controller.enqueue(toSse(event));
        await wait(event.type === "VERIFICATION_REQUIRED" ? 600 : 420);
      }

      controller.close();
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
