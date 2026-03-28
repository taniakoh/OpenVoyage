const baseUrl = process.env.TINYFISH_BASE_URL || "https://agent.tinyfish.ai";
const apiKey = process.env.TINYFISH_API_KEY;

const requestBody = {
  url: "https://news.ycombinator.com/jobs",
  goal:
    "Extract the first 15 job postings. For each, get the full title text as shown on the page, the URL it links to, and the posting date. Return as JSON array with keys: title, url, posted.",
};

if (!apiKey || apiKey === "REPLACE_WITH_YOUR_NEW_TINYFISH_API_KEY") {
  console.error(
    "TINYFISH_API_KEY is missing. Add a valid key to .env before running this test."
  );
  process.exit(1);
}

const response = await fetch(`${baseUrl}/v1/automation/run-sse`, {
  method: "POST",
  headers: {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
});

if (!response.ok || !response.body) {
  const errorText = await response.text();
  console.error(`Tinyfish request failed: ${response.status} ${response.statusText}`);
  if (errorText) {
    console.error(errorText);
  }
  process.exit(1);
}

const decoder = new TextDecoder();
let buffer = "";
let finalEvent = null;

for await (const chunk of response.body) {
  buffer += decoder.decode(chunk, { stream: true });
  const lines = buffer.split(/\r?\n/);
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;

    const payload = line.slice(6);
    if (!payload.trim()) continue;

    const event = JSON.parse(payload);
    console.log(`[${event.type}] ${event.status ?? ""}`.trim());

    if (event.type === "COMPLETE" && event.status === "COMPLETED") {
      finalEvent = event;
    }
  }
}

if (!finalEvent) {
  console.error("Tinyfish stream ended before a completed result was received.");
  process.exit(1);
}

console.log("\nResult JSON:\n");
console.log(
  typeof finalEvent.resultJson === "string"
    ? finalEvent.resultJson
    : JSON.stringify(finalEvent.resultJson, null, 2)
);
