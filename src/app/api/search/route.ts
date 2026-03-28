import { NextResponse } from "next/server";
import { z } from "zod";

import { getSearchSnapshot } from "@/lib/search";

const bodySchema = z.object({
  prompt: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const snapshot = await getSearchSnapshot(body.prompt);

    return NextResponse.json(snapshot);
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

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed unexpectedly."
      },
      { status: 500 }
    );
  }
}
