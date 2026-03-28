import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

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

const INTENT_MODEL = process.env.OPENAI_INTENT_MODEL || "gpt-4o-mini";

const intentParserPrompt = [
  "You extract structured travel intent from natural language prompts.",
  "Return only the requested JSON shape.",
  "Infer a likely origin only when the prompt strongly implies one; otherwise use the user's stated origin or a reasonable regional default.",
  "preferred_modes should contain transport modes such as ferry, train, flight, bus, or car.",
  "constraints should capture travel preferences or limits such as quiet, affordable, scenic, family-friendly, morning departure, or avoid crowds.",
  "verification_sources should list the sources the scouting system should check, such as reddit, x, local news, operator site, or forums.",
  "scout_queries should be short, practical search tasks that later agents can execute."
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
