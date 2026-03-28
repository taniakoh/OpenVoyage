import { parseIntentRequest } from "@/lib/intent-route";

export async function POST(request: Request) {
  return parseIntentRequest(request);
}
