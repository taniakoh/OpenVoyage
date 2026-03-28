import dns from "node:dns";
import http, { type IncomingHttpHeaders, type IncomingMessage, type RequestOptions } from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";

export type TinyFishRunRequest = {
  url: string;
  goal: string;
};

export type TinyFishStreamEvent = {
  type: string;
  status?: string;
  message?: string;
  resultJson?: unknown;
  result?: unknown;
  [key: string]: unknown;
};

export type TinyFishRunResult = {
  finalEvent: TinyFishStreamEvent;
  events: TinyFishStreamEvent[];
};

type TinyFishHttpResponse = {
  status: number;
  statusText: string;
  headers: IncomingHttpHeaders;
  body: IncomingMessage;
  text: () => Promise<string>;
};

function getTinyFishConnectTimeoutMs() {
  const parsed = Number(process.env.TINYFISH_CONNECT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90_000;
}

function getTinyFishMaxRetries() {
  const parsed = Number(process.env.TINYFISH_MAX_RETRIES);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}

export function getTinyFishConfig() {
  return {
    baseUrl: process.env.TINYFISH_BASE_URL || "https://agent.tinyfish.ai",
    apiKey: process.env.TINYFISH_API_KEY || "",
    connectTimeoutMs: getTinyFishConnectTimeoutMs(),
    maxRetries: getTinyFishMaxRetries()
  };
}

export function tinyFishEnabled() {
  return Boolean(process.env.TINYFISH_API_KEY);
}

export async function runTinyFishAutomation(
  request: TinyFishRunRequest,
  options?: {
    onEvent?: (event: TinyFishStreamEvent) => void;
    signal?: AbortSignal;
  }
): Promise<TinyFishRunResult> {
  const config = getTinyFishConfig();
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= config.maxRetries) {
    try {
      return await runTinyFishAutomationOnce(request, options?.signal, options?.onEvent);
    } catch (error) {
      if (!isRetryableTinyFishError(error) || attempt === config.maxRetries) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));
      attempt += 1;
      await wait(1000 * attempt);
    }
  }

  throw lastError ?? new Error("TinyFish automation failed unexpectedly.");
}

async function runTinyFishAutomationOnce(
  request: TinyFishRunRequest,
  signal?: AbortSignal,
  onEvent?: (event: TinyFishStreamEvent) => void
): Promise<TinyFishRunResult> {
  const response = await postTinyFishRunSse(request, {
    signal
  });

  if (response.status < 200 || response.status >= 300) {
    const errorText = await response.text();
    throw new Error(
      `TinyFish request failed with ${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
    );
  }

  const decoder = new TextDecoder();
  const events: TinyFishStreamEvent[] = [];
  let buffer = "";
  let finalEvent: TinyFishStreamEvent | null = null;

  for await (const chunk of response.body) {
    buffer += decoder.decode(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk), {
      stream: true
    });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue;
      }

      const payload = line.slice(6).trim();
      if (!payload) {
        continue;
      }

      const event = JSON.parse(payload) as TinyFishStreamEvent;
      events.push(event);
      onEvent?.(event);

      if (event.type === "COMPLETE") {
        finalEvent = event;
      }
    }
  }

  if (!finalEvent) {
    throw new Error("TinyFish stream ended before a COMPLETE event was received.");
  }

  return {
    finalEvent,
    events
  };
}

export async function postTinyFishRunSse(
  request: TinyFishRunRequest,
  options?: {
    signal?: AbortSignal;
  }
): Promise<TinyFishHttpResponse> {
  const config = getTinyFishConfig();
  const endpoint = new URL("/v1/automation/run-sse", withTrailingSlash(config.baseUrl));
  const payload = JSON.stringify(request);
  const transport = endpoint.protocol === "https:" ? https : http;

  return await new Promise<TinyFishHttpResponse>((resolve, reject) => {
    const requestOptions: RequestOptions = {
      method: "POST",
      headers: {
        "X-API-Key": config.apiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      },
      timeout: config.connectTimeoutMs,
      lookup: lookupTinyFishHost
    };

    const req = transport.request(endpoint, requestOptions, (res) => {
      cleanup();

      resolve({
        status: res.statusCode ?? 0,
        statusText: res.statusMessage ?? "",
        headers: res.headers,
        body: res,
        text: async () => readNodeStreamAsText(res)
      });
    });

    const abortHandler = () => {
      req.destroy(new Error("TinyFish request was aborted."));
    };

    const cleanup = () => {
      options?.signal?.removeEventListener("abort", abortHandler);
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        abortHandler();
        return;
      }

      options.signal.addEventListener("abort", abortHandler, { once: true });
    }

    req.on("timeout", () => {
      req.destroy(
        new Error(
          `Timed out waiting for TinyFish after ${config.connectTimeoutMs}ms. Set TINYFISH_CONNECT_TIMEOUT_MS to a higher value if the service is slow to accept the request or begin streaming on your network.`
        )
      );
    });

    req.on("error", (error) => {
      cleanup();

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

async function readNodeStreamAsText(stream: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function withTrailingSlash(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function getTinyFishResultPayload(event: TinyFishStreamEvent) {
  return event.resultJson ?? event.result ?? null;
}

const lookupTinyFishHost: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, options, (lookupError, address, family) => {
    if (!lookupError) {
      callback(null, address, family);
      return;
    }

    dns.resolve4(hostname, (resolveError, addresses) => {
      if (resolveError || addresses.length === 0) {
        callback(resolveError ?? lookupError, "", 4);
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
};

function isRetryableTinyFishError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /(ECONNRESET|ETIMEDOUT|EPIPE|aborted|stream ended before a COMPLETE event)/i.test(
    error.message
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
