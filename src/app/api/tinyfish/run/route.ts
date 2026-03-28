import { z } from "zod";

import { getTinyFishConfig, tinyFishEnabled } from "@/lib/tinyfish";

const bodySchema = z.object({
  url: z.string().url(),
  goal: z.string().min(1)
});

const encoder = new TextEncoder();

function mockStream(url: string, goal: string) {
  return new ReadableStream({
    async start(controller) {
      const messages = [
        { type: "STARTED", url, goal },
        { type: "PROGRESS", message: "Opening remote browser session" },
        { type: "PROGRESS", message: "Applying extraction goal" },
        {
          type: "COMPLETE",
          status: "COMPLETED",
          resultJson: {
            demo: true,
            summary: "TinyFish mock mode completed. Add TINYFISH_API_KEY to proxy live runs."
          }
        }
      ];

      for (const message of messages) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      controller.close();
    }
  });
}

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());

  if (!tinyFishEnabled()) {
    return new Response(mockStream(body.url, body.goal), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  }

  const config = getTinyFishConfig();
  const response = await fetch(`${config.baseUrl}/v1/automation/run-sse`, {
    method: "POST",
    headers: {
      "X-API-Key": config.apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    },
    status: response.status
  });
}
