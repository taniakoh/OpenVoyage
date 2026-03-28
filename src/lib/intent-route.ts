import { NextResponse } from "next/server";
import { z } from "zod";

import { getIntentModel, parseIntent } from "@/lib/intent";

const bodySchema = z.object({
  prompt: z.string().min(1)
});

export async function parseIntentRequest(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const intent = await parseIntent(body.prompt);

    return NextResponse.json({
      intent,
      source: "openai",
      model: getIntentModel()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
          details: error.flatten()
        },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "The intent parser request failed unexpectedly.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
