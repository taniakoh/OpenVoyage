# OpenVoyage

OpenVoyage is an AI-native travel planning and booking prototype built for the TinyFish SG Hackathon 2026. The product is designed around an "agentic web" workflow: users describe a trip in natural language, OpenVoyage turns that into structured travel intent, scouts routes across web sources, validates them with live signals, and prepares the booking flow in a cinematic mission-control style interface.

This repository contains the current frontend prototype and API scaffolding for that experience. It is built with Next.js 14 App Router, Tailwind CSS, Framer Motion, OpenAI for intent parsing, TinyFish for browser automation experiments, and Supabase for app data.

## What the Product Does

- Converts a freeform travel prompt into structured intent such as origin, destination, constraints, preferred transport modes, and verification sources.
- Frames route discovery as an agent workflow instead of a traditional search results page.
- Supports a "ground truth" style experience where routes can be validated against live web sources like operator sites, Reddit, X, and local news.
- Includes a TinyFish-backed automation endpoint for remote browser runs, with a built-in mock mode when no TinyFish API key is configured.
- Connects to Supabase and demonstrates live data reads on the gateway page.

## Current App Routes

- `/` - Gateway / Intent Canvas landing page
- `/signal-stream` - Discovery and scouting view
- `/mission-control` - Live sentry / itinerary style dashboard
- `/discovery-report` - Concierge brief / validation report
- `/booking-hud` - Booking execution interface

## API Endpoints

- `POST /api/intent/parse` - Parses a natural language prompt with OpenAI
- `POST /api/search` - Currently proxies to the same intent parsing flow
- `GET /api/thinking-trace` - Returns mock thinking trace data for the UI
- `POST /api/tinyfish/run` - Streams TinyFish automation events over SSE

## Tech Stack

- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- OpenAI Node SDK
- Supabase SSR client
- Zod

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in the values you want to use:

```bash
cp .env.example .env.local
```

If you are using PowerShell on Windows, you can run:

```powershell
Copy-Item .env.example .env.local
```

Environment variables currently used by the app:

- `OPENAI_API_KEY` - Required for `POST /api/intent/parse` and `POST /api/search`
- `OPENAI_INTENT_MODEL` - Optional override for the intent parsing model, defaults to `gpt-4o-mini`
- `TINYFISH_API_KEY` - Optional; if missing, `/api/tinyfish/run` falls back to mock streaming data
- `TINYFISH_BASE_URL` - Optional TinyFish base URL, defaults to `https://agent.tinyfish.ai`
- `TINYFISH_CONNECT_TIMEOUT_MS` - Optional timeout for waiting on TinyFish to accept the request and start streaming, defaults to `90000`
- `TINYFISH_MAX_RETRIES` - Optional retry count for retryable TinyFish transport failures, defaults to `1`
- `NEXT_PUBLIC_SUPABASE_URL` - Required for the Supabase client used by the app
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Required for the Supabase client used by the app
- `SUPABASE_URL` - Optional fallback for server-side Supabase configuration
- `SUPABASE_ANON_KEY` - Optional fallback for server-side Supabase configuration
- `UPSTASH_REDIS_REST_URL` - Optional for future Upstash-backed session/state work
- `UPSTASH_REDIS_REST_TOKEN` - Optional companion token for Upstash REST access

### 3. Prepare Supabase data

The home page reads from a `todos` table and displays up to five rows. To avoid an empty or failing state, create a `todos` table in your Supabase project with at least these columns:

- `id`
- `name`

If the table does not exist, the page will still load, but it will show the query error returned by Supabase.

### 4. Start the development server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Additional Commands

```bash
npm run build
npm run start
npm run lint
```

To test TinyFish directly with the script in this repo, add `TINYFISH_API_KEY` to `.env` and run:

```bash
npm run test:tinyfish
```

That script sends an automation request to TinyFish against the Hacker News Jobs page and prints the final `resultJson` once the SSE stream completes.
If your network is slow to complete the TinyFish TLS handshake or receive the first SSE event, raise `TINYFISH_CONNECT_TIMEOUT_MS` in `.env`.

## Notes on the Current State

- This repo is an early vertical slice, not a finished production booking platform.
- The search flow is currently centered on intent parsing and UI scaffolding rather than full live transport aggregation.
- TinyFish integration is set up as a streaming proxy endpoint and test harness, which makes it easy to iterate on agent automation without blocking local UI work.
- The product and design direction are documented in [`prd.md`](/Users/tanta/Downloads/Code/OpenVoyage/prd.md).
