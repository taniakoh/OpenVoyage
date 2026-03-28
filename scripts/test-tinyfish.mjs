import dns from "node:dns";
import http from "node:http";
import https from "node:https";

const baseUrl = process.env.TINYFISH_BASE_URL || "https://agent.tinyfish.ai";
const apiKey = process.env.TINYFISH_API_KEY;
const connectTimeoutMs = Number(process.env.TINYFISH_CONNECT_TIMEOUT_MS) > 0
  ? Number(process.env.TINYFISH_CONNECT_TIMEOUT_MS)
  : 90000;
const maxRetries = Number(process.env.TINYFISH_MAX_RETRIES) >= 0
  ? Number(process.env.TINYFISH_MAX_RETRIES)
  : 1;

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

let lastError = null;

for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
  try {
    await runOnce();
    process.exit(0);
  } catch (error) {
    lastError = error;

    if (!isRetryable(error) || attempt === maxRetries) {
      throw error;
    }

    console.warn(
      `TinyFish stream dropped on attempt ${attempt + 1}/${maxRetries + 1}. Retrying...`
    );
    await wait(1000 * (attempt + 1));
  }
}

throw lastError ?? new Error("TinyFish test failed unexpectedly.");

async function postTinyFishRunSse(baseUrl, apiKey, requestBody, timeoutMs) {
  const endpoint = new URL("/v1/automation/run-sse", withTrailingSlash(baseUrl));
  const transport = endpoint.protocol === "https:" ? https : http;
  const payload = JSON.stringify(requestBody);

  return await new Promise((resolve, reject) => {
    const req = transport.request(
      endpoint,
      {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: timeoutMs,
        lookup: lookupTinyFishHost,
      },
      (res) => {
        resolve({
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? "",
          body: res,
          text: async () => readNodeStreamAsText(res),
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(
        new Error(
          `Timed out waiting for TinyFish after ${timeoutMs}ms. Set TINYFISH_CONNECT_TIMEOUT_MS to a higher value if the service is slow to accept the request or begin streaming.`
        )
      );
    });

    req.on("error", (error) => {
      reject(
        new Error(
          `Unable to reach TinyFish at ${endpoint.origin}${endpoint.pathname}: ${error.message}`
        )
      );
    });

    req.write(payload);
    req.end();
  });
}

async function readNodeStreamAsText(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function withTrailingSlash(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

async function runOnce() {
  const response = await postTinyFishRunSse(baseUrl, apiKey, requestBody, connectTimeoutMs);

  if (response.status < 200 || response.status >= 300) {
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
    throw new Error("TinyFish stream ended before a completed result was received.");
  }

  console.log("\nResult JSON:\n");
  const resultPayload = finalEvent.resultJson ?? finalEvent.result ?? null;
  console.log(
    typeof resultPayload === "string"
      ? resultPayload
      : JSON.stringify(resultPayload, null, 2)
  );
}

function isRetryable(error) {
  return error instanceof Error
    && /(ECONNRESET|ETIMEDOUT|EPIPE|aborted|stream ended before a completed result was received)/i.test(
      error.message
    );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lookupTinyFishHost(hostname, options, callback) {
  dns.lookup(hostname, options, (lookupError, address, family) => {
    if (!lookupError) {
      callback(null, address, family);
      return;
    }

    dns.resolve4(hostname, (resolveError, addresses) => {
      if (resolveError || addresses.length === 0) {
        callback(resolveError ?? lookupError);
        return;
      }

      if (options?.all) {
        callback(
          null,
          addresses.map((resolvedAddress) => ({ address: resolvedAddress, family: 4 }))
        );
        return;
      }

      callback(null, addresses[0], 4);
    });
  });
}
