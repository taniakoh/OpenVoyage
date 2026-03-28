🚀 The OpenVoyage "Live-Wire" Execution Plan
Phase 1: The Nervous System (Foundation & Intent)
Goal: Convert a "Vibe" prompt into a machine-readable JSON plan.

[ ] Setup: Initialize Next.js 14+ (App Router), Tailwind, and Shadcn/UI.

[ ] API Route /api/search: Create a GPT-4o/Claude 3.5 structured output route.

[ ] The Intent Parser: Feed the prompt (e.g., "I want a quiet beach trip to Batam via ferry") to the LLM.

[ ] Output Schema: Ensure it returns destination, preferred_modes, and scout_queries.

Phase 2: The Hands (TinyFish Scout Integration)
Goal: Deploy remote browsers to scrape "API-blind" transport sites.

[ ] TinyFish Client: Set up the utility to request remote browser sessions via the TinyFish API.

[ ] Scout Script: Write a generic browser-use controller that takes a URL and a goal (e.g., "Find the cheapest ferry on Saturday").

[ ] Parallel Execution: Use Promise.all to trigger three scouts:

Transport A: (e.g., BatamFast Ferry)

Transport B: (e.g., KTM Train)

Social Scout: (Reddit/X search for "Woodlands/Harbourfront delays").

[ ] Streaming: Setup SSE (Server-Sent Events) to stream "Agent Logs" (JetBrains Mono style) to the frontend.

Phase 3: The Cinematic Gateway (UI Layer 1)
Goal: Implement the "Awe and Serenity" landing page.

[ ] Hero Component: Full-bleed background with Framer Motion parallax.

[ ] Intent Canvas: Build the glassmorphism input box with the glowing rgba(255,255,255,0.1) border.

[ ] Integration Orbit: Create the pulsing SVG icons that react to input focus.

[ ] Thinking Trace: Connect the SSE stream from Phase 2 to a floating "Nodes" visualization.

Phase 4: The Discovery Bento (UI Layer 2)
Goal: Display agent findings with "Ground Truth" validation.

[ ] Bento Grid: Build the 32px corner radius glass cards.

[ ] Live Sentry Badge: Add the Neon Mint pulsing aura for routes verified by the Social Scout.

[ ] Vibe Map: Integrate destination images with floating sentiment tags extracted from Reddit.

[ ] Logic Hover: Add a small "Agent's Note" tooltip explaining why this route was picked.

Phase 5: The Execution HUD & MFA Bridge
Goal: The "Heads-Up Display" for autonomous booking.

[ ] Shadow Browser Portal: A modal displaying the TinyFish live-stream (via VNC/Websocket) so the user sees the agent "typing."

[ ] Form-Injection: Use browser-use to map user profile data (stored in Supabase) to the HTML fields.

[ ] MFA Bridge: Create a high-urgency Sunset Ember modal that pops up when the agent detects a "Verification Required" screen.

[ ] Final Hand-off: Provide the "Confirm Payment" button that triggers the final agent click.

Phase 6: Post-Booking "Live Sentry"
Goal: 24/7 monitoring and "Self-Healing."

[ ] Itinerary Timeline: A vertical Teal Glow thread.

[ ] Alert Logic: A background cron (or interval) that re-scrapes social sentiment every 30 mins.

[ ] Emergency Signal: Slide-in card for detected delays.