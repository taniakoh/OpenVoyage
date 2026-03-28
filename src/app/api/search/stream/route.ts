import { z } from "zod";

import { createExecutionPlan, parseIntent } from "@/lib/intent";
import { buildScoutDefinitions, executeScout, rankScoutResults } from "@/lib/scouts";
import { createWorkflowEvent } from "@/lib/workflow";

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
      enqueue(
        controller,
        createWorkflowEvent("workflow_started", {
          prompt,
          message: "Prompt received. Initializing OpenAI planning and scout orchestration."
        })
      );

      try {
        const intent = await parseIntent(prompt);
        enqueue(
          controller,
          createWorkflowEvent("intent_parsed", {
            intent,
            message: "OpenAI parsed the trip intent into a structured scouting brief."
          })
        );

        const scouts = buildScoutDefinitions(intent);
        const plan = await createExecutionPlan(
          prompt,
          intent,
          scouts.map((scout) => ({
            id: scout.id,
            title: scout.label,
            lane: scout.lane,
            url: scout.url,
            purpose: scout.goal
          }))
        );

        enqueue(
          controller,
          createWorkflowEvent("plan_created", {
            plan,
            message: "OpenAI created the execution plan and ordered the scout lanes."
          })
        );

        scouts.forEach((scout) => {
          enqueue(
            controller,
            createWorkflowEvent("agent_queued", {
              message: `Queued ${scout.label} for ${scout.url}`,
              agent: {
                agentId: scout.id,
                agentLabel: scout.label,
                lane: scout.lane,
                url: scout.url,
                goal: scout.goal,
                status: "queued"
              }
            })
          );
        });

        enqueue(
          controller,
          createWorkflowEvent("synthesis_started", {
            message: "Browser agents are launching in parallel. Results will be synthesized once all lanes report."
          })
        );

        const results = await Promise.all(
          scouts.map(async (scout) => {
            const result = await executeScout(scout, intent, {
              onEvent(progressEvent) {
                enqueue(
                  controller,
                  createWorkflowEvent(progressEvent.eventType, {
                    message: progressEvent.message,
                    agent: progressEvent.agent
                  })
                );
              }
            });

            enqueue(
              controller,
              createWorkflowEvent(result.status === "completed" ? "agent_completed" : "agent_failed", {
                message: `${scout.label} ${result.status}. ${result.summary}`,
                agent: {
                  agentId: scout.id,
                  agentLabel: scout.label,
                  lane: scout.lane,
                  url: scout.url,
                  goal: scout.goal,
                  status: result.status,
                  summary: result.summary,
                  result: result.resultJson,
                  rawPayload: result.rawEvents.at(-1) ?? null,
                  rawEventType: result.rawEvents.at(-1)?.type,
                  rawEventStatus: result.rawEvents.at(-1)?.status
                }
              })
            );

            return result;
          })
        );

        const rankedSummary = rankScoutResults(results);

        enqueue(
          controller,
          createWorkflowEvent("workflow_completed", {
            message: "OpenVoyage ranked the scout results and selected the lead route.",
            summary: {
              ...rankedSummary,
              plan,
              agentOutcomes: results
            }
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "The scout stream failed unexpectedly.";
        const stage =
          /parsed intent/i.test(message) || /OPENAI_API_KEY/i.test(message)
            ? "intent"
            : /execution plan/i.test(message)
              ? "planning"
              : /TinyFish|scout/i.test(message)
                ? "scouting"
                : "unknown";

        enqueue(
          controller,
          createWorkflowEvent("workflow_error", {
            message,
            stage
          })
        );
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
