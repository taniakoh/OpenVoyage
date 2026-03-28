# TinyFish Usage Notes

Compiled from the TinyFish Cookbook repository on March 28, 2026:

- Main repo: https://github.com/tinyfish-io/tinyfish-cookbook
- README: https://github.com/tinyfish-io/tinyfish-cookbook/blob/main/README.md
- `use-tinyfish` skill: https://github.com/tinyfish-io/tinyfish-cookbook/blob/main/skills/use-tinyfish/SKILL.md

## What TinyFish Is

TinyFish is presented in the cookbook as a web-agent platform that turns real websites into programmable surfaces. Instead of manually handling headless browsers, selectors, proxies, and multi-step navigation, you send TinyFish a URL plus a natural-language goal and it returns structured results, typically JSON.

According to the repository, TinyFish is designed for:

- scraping and extraction from normal websites
- navigating dynamic or multi-step sites
- filling forms and applying filters
- running browser automation on sites without public APIs
- working around difficult browser automation details with managed infrastructure

## Main Ways To Use TinyFish

The cookbook shows two primary ways to utilise TinyFish:

### 1. HTTP API

The main README shows a direct API workflow using:

`POST https://agent.tinyfish.ai/v1/automation/run-sse`

You send:

- `X-API-Key`
- `Content-Type: application/json`
- a JSON body with at least:
  - `url`
  - `goal`

The response is streamed as server-sent events, so you can watch the run progress and read the final result from the completion event.

Example request body:

```json
{
  "url": "https://agentql.com",
  "goal": "Find all AgentQL subscription plans and their prices. Return result in json format"
}
```

### 2. TinyFish CLI

The cookbook also includes a `use-tinyfish` skill that documents the TinyFish CLI for terminal-based automation:

```bash
tinyfish agent run --url <url> "<goal>"
```

Useful flags described in the repo:

- `--sync` waits for the full result before returning
- `--async` submits the run and returns immediately
- `--pretty` formats output for humans

By default, the CLI streams SSE JSON events to stdout.

## Getting Started

### API key

The cookbook says you should sign up on TinyFish and get an API key from the platform:

- https://tinyfish.ai
- API key page mentioned in the skill: https://agent.tinyfish.ai/api-keys

### CLI pre-flight checks

The `use-tinyfish` skill says to always verify both of these before using the CLI:

```bash
which tinyfish && tinyfish --version || echo "TINYFISH_CLI_NOT_INSTALLED"
tinyfish auth status
```

If the CLI is missing, the repo recommends:

```bash
npm install -g @tiny-fish/cli
```

For authentication, the skill describes three options:

1. Interactive login:

```bash
tinyfish auth login
```

2. Environment variable:

```bash
export TINYFISH_API_KEY="your-key-here"
```

3. Tooling config via a local settings file that injects `TINYFISH_API_KEY`

## Core Usage Pattern

TinyFish works best when the goal is explicit and asks for a precise output shape.

Good pattern:

- give one clear target URL
- describe the task in natural language
- state the exact JSON you want returned

Example:

```bash
tinyfish agent run --url "https://example.com" \
  "Extract product info as JSON: {\"name\": str, \"price\": str, \"in_stock\": bool}"
```

For lists:

```bash
tinyfish agent run --url "https://example.com/products" \
  "Extract all products as JSON array: [{\"name\": str, \"price\": str, \"url\": str}]"
```

For multi-step workflows:

```bash
tinyfish agent run --url "https://example.com/search" \
  "Search for 'wireless headphones', apply filter for price under $50, extract the top 5 results as JSON: [{\"name\": str, \"price\": str, \"rating\": str}]"
```

## How To Read Results

The CLI documentation in the repo says the output is streamed as `data: {...}` SSE lines.

The final result is the event where:

- `type == "COMPLETE"`
- `status == "COMPLETED"`

The extracted payload is in:

- `resultJson`

That means the important habit is to design the requested JSON shape carefully so `resultJson` is immediately useful downstream.

## Recommended Best Practices

From the cookbook materials, the practical guidance is:

- always ask for a strict JSON structure in the goal
- keep each extraction focused on one website or one independent task
- use separate parallel runs for separate sites
- use sync mode when later logic depends on the completed result
- use pretty mode only when you want to read the result directly as a human
- match the response language to the user or workflow language

### Parallelism rule

The `use-tinyfish` skill is very explicit here: do not combine unrelated websites into one run when they can be handled independently.

Preferred:

```bash
tinyfish agent run --url "https://pizzahut.com" \
  "Extract pizza prices as JSON: [{\"name\": str, \"price\": str}]"
```

```bash
tinyfish agent run --url "https://dominos.com" \
  "Extract pizza prices as JSON: [{\"name\": str, \"price\": str}]"
```

Avoid:

```bash
tinyfish agent run --url "https://pizzahut.com" \
  "Extract prices from Pizza Hut and also go to Dominos..."
```

The reason, based on the repo guidance, is that separate runs are faster and more reliable.

## API Examples From The Cookbook

### cURL

```bash
curl -N -X POST https://agent.tinyfish.ai/v1/automation/run-sse \
  -H "X-API-Key: $TINYFISH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://agentql.com",
    "goal": "Find all AgentQL subscription plans and their prices. Return result in json format"
  }'
```

### Python

```python
import json
import os
import requests

response = requests.post(
    "https://agent.tinyfish.ai/v1/automation/run-sse",
    headers={
        "X-API-Key": os.getenv("TINYFISH_API_KEY"),
        "Content-Type": "application/json",
    },
    json={
        "url": "https://agentql.com",
        "goal": "Find all AgentQL subscription plans and their prices. Return result in json format",
    },
    stream=True,
)

for line in response.iter_lines():
    if line:
        line_str = line.decode("utf-8")
        if line_str.startswith("data: "):
            event = json.loads(line_str[6:])
            print(event)
```

### TypeScript

```ts
const response = await fetch("https://agent.tinyfish.ai/v1/automation/run-sse", {
  method: "POST",
  headers: {
    "X-API-Key": process.env.TINYFISH_API_KEY!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://agentql.com",
    goal: "Find all AgentQL subscription plans and their prices. Return result in json format",
  }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

## Managing Runs In The CLI

The skill file documents these run-management commands:

```bash
tinyfish agent run list
tinyfish agent run get <run_id>
tinyfish agent run cancel <run_id>
```

Use these to inspect recent runs, fetch a specific run, or cancel an automation already in progress.

## What The Cookbook Suggests TinyFish Is Good At

Based on the repo examples, TinyFish is well suited for:

- competitor monitoring
- shopping and price comparison
- academic or web research
- travel and accommodation search
- marketplace aggregation
- content availability lookup
- QA and browser task automation
- lead, tender, or scholarship discovery from public websites

The cookbook structure suggests a common pattern:

1. choose one or more websites
2. define a narrow goal
3. request structured JSON output
4. run multiple agents in parallel when sources are independent
5. combine results in your app, CLI, workflow, or dashboard

## Practical Template

If you want a reusable way to utilise TinyFish, this is the clearest cookbook-aligned template:

```text
URL: https://target-site.com
Goal: Perform <task>. Return JSON in this exact shape: <schema>.
```

Example:

```text
URL: https://store.example.com/laptops
Goal: Find the top 10 laptops under $1000. Return JSON in this exact shape:
[{"name": str, "price": str, "brand": str, "url": str, "in_stock": bool}]
```

## Summary

The TinyFish Cookbook teaches that the best way to utilise TinyFish is to treat it as a browser automation and extraction layer driven by:

- one target website per run when possible
- natural-language task instructions
- explicit JSON output requirements
- parallel execution across independent sources
- SSE streaming for progress and final structured results

If you want, this file can be expanded next into:

- a shorter quickstart version
- a developer integration guide for this repo
- a TinyFish prompt cookbook with reusable task templates
