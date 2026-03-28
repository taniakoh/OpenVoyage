const encoder = new TextEncoder();

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const events = [
        { step: "Intent parsed", agent: "Parser", status: "completed" },
        { step: "Launching TinyFish ferry scout", agent: "Scout A", status: "running" },
        { step: "Scanning Reddit checkpoint chatter", agent: "Ground Truth", status: "running" },
        { step: "Composing ranked itinerary", agent: "Synthesizer", status: "queued" }
      ];

      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 350));
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
