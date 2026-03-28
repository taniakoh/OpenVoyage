import { z } from "zod";

import { buildLiveSentrySnapshot } from "@/lib/live-sentry";

const querySchema = z.object({
  scenario: z.enum(["stable", "watch", "delay"]).optional()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    scenario: searchParams.get("scenario") ?? undefined
  });

  if (!parsedQuery.success) {
    return new Response(JSON.stringify({ error: "Invalid live sentry scenario." }), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  return Response.json(buildLiveSentrySnapshot(parsedQuery.data.scenario));
}
