import { Readable } from "node:stream";
import { z } from "zod";

import { postTinyFishRunSse, tinyFishEnabled } from "@/lib/tinyfish";

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

  try {
    const response = await postTinyFishRunSse(body);
    const contentType = Array.isArray(response.headers["content-type"])
      ? response.headers["content-type"][0]
      : response.headers["content-type"];

    return new Response(Readable.toWeb(response.body) as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": contentType || "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      },
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reach TinyFish from the server route."
      },
      { status: 502 }
    );
  }
}
