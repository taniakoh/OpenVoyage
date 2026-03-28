import { z } from "zod";

import { getSearchSnapshot } from "@/lib/search";

const encoder = new TextEncoder();

const querySchema = z.object({
  prompt: z.string().min(1).optional()
});

const defaultPrompt =
  "Find me the quietest Batam ferry from Singapore tomorrow morning, keep it affordable, and verify checkpoint conditions with Reddit and local news.";

function enqueue(controller: ReadableStreamDefaultController<Uint8Array>, payload: unknown) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    prompt: searchParams.get("prompt") ?? undefined
  });

  if (!parsedQuery.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid prompt query parameter."
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const prompt = parsedQuery.data.prompt || defaultPrompt;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await getSearchSnapshot(prompt, {
          onEvent(event) {
            enqueue(controller, event);
          }
        });
      } catch (error) {
        enqueue(controller, {
          type: "error",
          message: error instanceof Error ? error.message : "The scout stream failed unexpectedly."
        });
      } finally {
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
