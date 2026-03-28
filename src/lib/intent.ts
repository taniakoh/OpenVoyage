import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import type { ExecutionPlan } from "@/lib/workflow";

export const parsedIntentSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  constraints: z.array(z.string().min(1)).max(6),
  preferred_modes: z.array(z.string().min(1)).max(5),
  verification_sources: z.array(z.string().min(1)).max(5),
  scout_queries: z.array(z.string().min(1)).min(1).max(6)
});

export type ParsedIntent = z.infer<typeof parsedIntentSchema> & {
  modes: string[];
};

export type PlanningScoutInput = {
  id: string;
  title: string;
  lane: "transport" | "social";
  url: string;
  purpose: string;
};

const INTENT_MODEL = process.env.OPENAI_INTENT_MODEL || "gpt-4o-mini";
const PLAN_MODEL = process.env.OPENAI_PLAN_MODEL || INTENT_MODEL;

const intentParserPrompt = [
  "You extract structured travel intent from natural language prompts.",
  "Return only the requested JSON shape.",
  "Infer a likely origin only when the prompt strongly implies one; otherwise use the user's stated origin or a reasonable regional default.",
  "preferred_modes should contain transport modes such as ferry, train, flight, bus, or car.",
  "constraints should capture travel preferences or limits such as quiet, affordable, scenic, family-friendly, morning departure, or avoid crowds.",
  "verification_sources should list the sources the scouting system should check, such as reddit, x, local news, operator site, or forums.",
  "scout_queries should be short, practical search tasks that later agents can execute."
].join(" ");

const executionPlanSchema = z.object({
  tripSummary: z.string().min(1),
  planningNote: z.string().min(1),
  laneStrategy: z.string().min(1),
  rankingCriteria: z.array(z.string().min(1)).min(2).max(5),
  verificationStrategy: z.array(z.string().min(1)).min(2).max(5),
  fallbackStrategy: z.string().min(1),
  steps: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        lane: z.enum(["transport", "social"]),
        site: z.string().min(1),
        purpose: z.string().min(1),
        successSignal: z.string().min(1)
      })
    )
    .min(1)
    .max(6)
});

const executionPlanPrompt = [
  "You create a concise execution plan for a live travel scouting workflow.",
  "Use the parsed travel intent plus the provided scout definitions.",
  "Keep the plan visible and operational, not essay-like.",
  "Explain the trip summary, the lane strategy, ranking criteria, verification strategy, fallback behavior, and the ordered steps.",
  "Each step should describe one scout agent and the signal that makes it successful.",
  "Preserve each provided scout id exactly in steps.id.",
  "Do not invent extra scouts or sites outside the supplied scout definitions.",
  "Return only the requested JSON shape."
].join(" ");

let client: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return client;
}

export function getIntentModel() {
  return INTENT_MODEL;
}

export function getPlanModel() {
  return PLAN_MODEL;
}

export async function parseIntent(prompt: string): Promise<ParsedIntent> {
  const response = await getOpenAIClient().responses.parse({
    model: INTENT_MODEL,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: intentParserPrompt }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: prompt }]
      }
    ],
    text: {
      format: zodTextFormat(parsedIntentSchema, "parsed_travel_intent")
    }
  });

  const intent = response.output_parsed;

  if (!intent) {
    throw new Error("OpenAI did not return a parsed intent payload.");
  }

  return {
    ...intent,
    modes: intent.preferred_modes
  };
}

export async function createExecutionPlan(
  prompt: string,
  intent: ParsedIntent,
  scouts: PlanningScoutInput[]
): Promise<ExecutionPlan> {
  const response = await getOpenAIClient().responses.parse({
    model: PLAN_MODEL,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: executionPlanPrompt }]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                prompt,
                intent,
                scouts
              },
              null,
              2
            )
          }
        ]
      }
    ],
    text: {
      format: zodTextFormat(executionPlanSchema, "execution_plan")
    }
  });

  const plan = response.output_parsed;

  if (!plan) {
    throw new Error("OpenAI did not return an execution plan payload.");
  }

  return {
    ...plan,
    steps: plan.steps.map((step, index) => {
      const matchingScout =
        scouts.find((scout) => scout.id === step.id) ??
        scouts.find((scout) => scout.title === step.title) ??
        scouts[index];

      return {
        ...step,
        id: matchingScout?.id ?? step.id,
        title: matchingScout?.title ?? step.title,
        lane: matchingScout?.lane ?? step.lane,
        site: matchingScout?.url ?? step.site,
        purpose: matchingScout?.purpose ?? step.purpose
      };
    })
  };
}
