This technical requirements document transitions OpenVoyage from a conceptual PRD into a buildable specification. Per your request, the stack is centered on Next.js for the full-stack architecture and TinyFish as the primary infrastructure for agentic browsing.

🛠️ OpenVoyage: Technical Requirements
1. Core Technology Stack
Framework: Next.js 14+ (App Router).

Frontend: Tailwind CSS, Framer Motion (for Liquid Glass animations).

Backend: Next.js API Routes / Server Actions.

Agent Infrastructure: TinyFish API.

Used for: Remote browser orchestration, bypassing anti-bot on travel sites, and high-scale parallel scraping.

Agent Logic: browser-use + LangChain/AI SDK.

LLM: GPT-4o or Claude 3.5 Sonnet (High-reasoning for "messy" HTML).

Real-time Communication: WebSockets (via Socket.io) or Server-Sent Events (SSE) for the "Thinking Trace."

Database/State: Supabase (PostgreSQL) + Redis (for active browser session persistence).

2. System Architecture & TinyFish Integration
The system follows a Decoupled Agent Architecture. Next.js handles the user session and UI, while the TinyFish API manages the "Hands" (Browsers).

TinyFish API Implementation
The TinyFish API will be utilized to provide remote browser sessions. This is critical for sites like KTM or BatamFast that have aggressive bot detection.

Endpoint Integration: Next.js Server Actions will call the TinyFish API to spin up a headless instance.

Session Management: Store the TinyFish sessionId in Redis to allow users to refresh the page without losing the "Scout" or "Executor" agent's progress.

3. Functional Technical Requirements
3.1 The Intent Parser (NLP Layer)
Requirement: Extract travel entities from unstructured natural language.

Implementation: Use a Next.js API route to send the prompt to an LLM with a strictly defined JSON Schema.

Output: ```json
{
"origin": "Singapore",
"destination": "Batam",
"constraints": ["quiet", "cheap"],
"modes": ["ferry", "train"],
"verification_sources": ["reddit", "twitter"]
}


3.2 Multi-Modal Browser Scouts (TinyFish Layer)
Requirement: Parallel execution of browser agents on non-API sites.

Implementation: * Trigger multiple browser-use agents in parallel via Promise.all.

Each agent connects to a TinyFish remote browser to perform the search.

Anti-Bot Strategy: Utilize TinyFish's residential proxy rotation and human-mimicry headers.

Requirement: Agents must return raw data (Price, Time, Operator) plus a "Screenshot" of the result for the "Cinematic" UI preview.

3.3 The "Ground Truth" Sentinel (Social Scraper)
Requirement: Real-time sentiment analysis of the Open Web.

Implementation: * Scout A (Reddit): Navigates to reddit.com/r/[location] and searches for "delay" or "status" within the last 24h.

Scout B (X/Twitter): Searches for hashtags like #ChangiAirport or #WoodlandsCheckpoint.

Logic: LLM categorizes snippets into a numerical_status (1-10) and a summary_text.

3.4 The Execution HUD (Form-Filling)
Requirement: Autonomous navigation through a multi-step checkout.

Implementation: * Use Playwright (running via TinyFish) to locate fields like first_name, passport_no.

MFA Handling: If a 2FA screen is detected, the agent triggers a Next.js Server Action to push a notification to the frontend, pausing the browser session until the user inputs the code.

4. Vertical Slice Implementation Plan
Phase 1: The "Thin" Core (H+4)
Setup Next.js boilerplate and connect to TinyFish API.

Task: Successfully scrape a single site (e.g., BatamFast) using a natural language prompt.

Deliverable: A terminal output showing price and time from a browser-scraped source.

Phase 2: The "Thinking Trace" (H+8)
Implement SSE (Server-Sent Events) in Next.js to stream agent logs.

Task: UI displays "Agent 1: Navigating to KTM..." in real-time.

Deliverable: The "Cinematic" Gateway page with a working status log.

Phase 3: Parallel Discovery (H+12)
Implement async parallel scouts for Ferry + Train + Reddit.

Task: Collate results into the Bento Grid.

Deliverable: The Results page displaying multi-modal options with "Live" badges.

Phase 4: Autonomous Execution (H+18)
Implement the "Form-Fill" logic using stored user profiles.

Task: The agent reaches the payment page on a travel site.

Deliverable: The "Execution HUD" demo showing the browser acting autonomously.

5. Security & Compliance
Sensitive Data: PII (Passport, Credit Card) must be encrypted at rest in Supabase.

Agent Guardrails: Implement a "Maximum Action Count" per session to prevent infinite browser loops and excessive TinyFish API costs.

Human-in-the-loop: Any payment execution must require a final manual "Confirm" click from the user after the form is filled.