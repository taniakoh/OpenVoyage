# 🧭 Product Requirements Document: OpenVoyage (v1.0)

> **Tagline:** *"The Autonomous Travel Agent that Browses the Messy Web for You."*
>
> **Target Event:** TinyFish SG Hackathon 2026
> **Version:** 1.0 (Hackathon Edition)
> **Status:** Initial Draft

---

## 1. Executive Summary

OpenVoyage is an AI-native travel orchestrator built for the **"Agentic Web."** It moves beyond the limitations of static API partnerships (Expedia, Skyscanner) by using autonomous browser agents to treat the entire live web as a real-time database. It discovers "hidden" routes (regional ferries, KTM trains), validates them against real-time social sentiment (Reddit/X), and executes multi-modal bookings directly through web interfaces.

**Strategic Vision:** Displace traditional travel agencies by providing superior, real-time curation and 24/7 autonomous support — with no commission bias and no office hours.

---

## 2. Problem Statement

| Problem | Description |
|---|---|
| **The API Blind Spot** | Regional transport like KTM trains and Batam ferries lack modern APIs, making them invisible to mainstream search engines. |
| **The "Ground Truth" Gap** | Official status pages are often laggy or inaccurate. Real-time data on border delays exists only in unstructured text on social platforms. |
| **The Booking Friction** | Users face "tab fatigue," manually coordinating and filling out forms across 5+ disconnected, often anti-bot, legacy websites. |
| **The Agency Disruption** | Traditional travel agents are slow and commission-biased. OpenVoyage offers 24/7, unbiased, live-web intelligence. |

---

## 3. Goals & Key Metrics (KPIs)

| Metric | Target | Description |
|---|---|---|
| **Autonomy Rate** | >90% | Percentage of the booking flow completed without user clicks. |
| **Search Breadth** | 3+ Sources | Successful extraction from sites without public APIs (KTM, Ferry, etc.). |
| **Intent-to-Action** | <60s | Time from the initial prompt to reaching the final checkout page. |
| **Trust Score** | 4.5/5 | User rating of the "Ground Truth" (social) data accuracy versus reality. |

---

## 4. User Personas

| Persona | Pain Point | OpenVoyage Solution |
|---|---|---|
| **The Vibe Explorer** | Wants a specific atmosphere (e.g., "Dark Academia," "Quiet Beach") and relies on social proof over professional photos. | Ground Truth Scout extracts raw sentiment from Reddit/blogs. |
| **The Logistical Optimizer** | Needs to coordinate complex, multi-modal routes (Flight + Ferry + Car) without opening 10 tabs. | Multi-Modal Scraper finds and chains routes across disconnected portals. |
| **The Budget Nomad** | Searches for "Anywhere" based on a strict price cap and real-time deal scraping. | "Go Anywhere" logic generates destinations from budget constraints. |
| **The Time-Poor Professional** | No time to fill out multiple booking forms per trip. | Autonomous Executor handles form-filling and checkouts end-to-end. |

---

## 5. User Experience & Design Principles

The UI follows a **"Cinematic Haven"** aesthetic, blending the vastness of exploration with the serenity of a premium concierge.

### 5.1 Design Pillars

- **Visual Style:** *"The Celestial Frontier."* Full-bleed cinematic backgrounds (mountains, horizons) with high-blur glassmorphism.
- **Typography:**
  - Headings: High-contrast Serif — **Playfair Display**
  - UI / Body: Clean Sans-Serif — **Inter**
  - Agent Logs: Technical Monospace — **JetBrains Mono** (10px)
- **Glassmorphism Spec:** 40px backdrop blur, 1px glowing border (`rgba(255,255,255,0.1)`), soft deep shadows.
- **Motion:** Parallax backgrounds; spring-physics for all modal transitions and card expansions.

### 5.2 Color Palette

| Name | Hex | Usage |
|---|---|---|
| **Teal Glow** | `#00E5FF` | Exploration, active signals, primary CTAs |
| **Haven White** | `#F8FAFC` | Primary text, elegance |
| **Midnight Canvas** | `#050B18` | Depth, dark mode overlays |
| **Sunset Ember** | `#FF7E5F` | Urgency, warnings, critical Live signals |
| **Neon Mint** | `#00F260` | "Live" verified status, safety indicators |

---

## 6. Page-by-Page Design Requirements

### Page 1: The Gateway (Hero / Landing)

**Goal:** Create a sense of "Awe and Serenity" — the start of a journey.

- **Background:** Full-bleed, high-definition cinematic landscape (misty morning mountains or serene lunar horizon).
- **The Intent Canvas:** A central, floating glass text input with a 40px backdrop blur and soft glowing border ring.
- **The Integration Orbit:** A semi-circle of floating icons (Reddit, X, KTM, Flight, Hotel) that pulse or glow when the user is typing.
- **Typography:** Large elegant Serif hero copy: *"Where shall we discover today?"*
- **CTA:** A single glowing button with Teal Glow hover — `Start Exploring ↗`

---

### Page 2: The Signal Stream (Results / Discovery)

**Goal:** Visualize the "Hard Work" of the agent while keeping the UI clean and cinematic.

- **The Thinking Trace:** Glowing nodes that float over the landscape background, each representing an active data source (e.g., a pulsing Reddit icon when scraping). Uses Monospace labels.
- **Multi-Modal Bento Grid:**
  - Ultra-transparent glass cards, 40px backdrop blur, 32px corner radius, 1px glowing border.
  - Live Sentry Badge: Pulsing aura in Neon Mint for verified data.
  - Skeleton States: Shimmering "frozen glass" placeholders while data is being fetched.
- **Hover Expand:** Reveals the agent's 1-sentence logic for recommending that route.

---

### Page 3: The Concierge Brief (Validation / "Truth" Report)

**Goal:** Present the "Ground Truth" with the authority of a premium concierge.

- **Layout:** Split view — narrative on the left, visual intelligence on the right.
- **Left (Narrative):** High-contrast Serif typography with the agent's curated summary (e.g., *"Reddit reports suggest the 2 PM ferry is congested; I've prioritised the 1 PM for you."*)
- **Right (The Vibe Map):** High-quality destination imagery with floating Sentiment Tags (*"Quiet," "Hidden Gem," "Local Favourite"*).
- **Discovery Signal:** A visual "Signal Strength" meter showing how much Open Web data was used (e.g., *5 Reddit threads, 2 news reports*).
- **Agency Comparison Widget:** A small toggle/table showing OpenVoyage's price and time savings versus a standard API result.
- **CTA:** A prominent, gently pulsing `Execute Booking` button.

---

### Page 4: The Execution Portal (Booking / HUD)

**Goal:** Make autonomous booking feel like a Heads-Up Display (HUD) from a sci-fi film.

- **Shadow Browser Overlay:** A semi-transparent modal showing the live website being navigated in the background.
- **Agent HUD Elements:**
  - **Logic Beam:** Subtle light beams connecting the agent avatar to the form fields currently being filled.
  - **Status Orbit:** A circular progress ring (Details → Seat → Payment) that fills as each step completes.
- **MFA Bridge:** A high-visibility, glowing modal that triggers only when the agent hits a 2FA/Captcha wall — prompts the user with: *"I've hit a security wall. Please enter the SMS code to continue."*

---

### Page 5: The Live Sentry (Post-Booking / Itinerary Companion)

**Goal:** Post-booking dashboard that feels like a "Celestial Mission Control."

- **Dynamic Itinerary Timeline:** A vertical thread using Teal Glow for upcoming items, Midnight Canvas for completed ones.
- **Proactive Alert Cards:** Minimalist, high-contrast "Emergency Signal" cards in Sunset Ember that slide in upon detecting a delay or weather warning.
- **The "Self-Heal" Interaction:** A button that triggers an animation of the agent "re-scanning" the web to find a replacement for a disrupted plan.
- **Mobile Optimised:** Large tap targets; compact layout for on-the-go travelers.

---

## 7. Functional Requirements (MVP)

### 7.1 The Intent Canvas (The Gateway)

- **Requirement:** A single, floating natural language input area.
- **Function:** Uses an LLM to parse "vibe" (e.g., *"Dark Academia," "Quiet Beach"*) and logistical constraints (budget, dates, origin) into structured execution JSON.
- **Design:** Floating glass ring with an "Integration Orbit" of pulsing source icons.

### 7.2 Multi-Modal Scout Agents (Discovery)

- **Requirement:** Parallel browser agents scraping non-API transport portals.
- **Function:** Simultaneously navigates KTM (train), Batam Fast (ferry), and LCC portals (Scoot/AirAsia) to extract real-time pricing and availability.
- **Design:** Results displayed in the ultra-transparent Bento Grid with pulsing Neon Mint verified badges.

### 7.3 The Ground Truth Sentinel (Validation)

- **Requirement:** Unstructured social data extraction for real-time route validation.
- **Function:** Scrapes Reddit (r/Singapore, r/travel, local subs) and X/Twitter for the last 24 hours to detect delays, congestion, or "vibe" sentiment. Outputs a categorised status: `CLEAR` / `DELAYED` / `CHAOTIC`.
- **Design:** Thinking Trace visualised as glowing nodes floating over the background.

### 7.4 The Execution HUD (Action)

- **Requirement:** Autonomous form-injection and MFA handling.
- **Function:** A semi-transparent Heads-Up Display where users watch the agent fill passport and contact details on the live site.
- **MFA Bridge:** A glowing modal that triggers only when human 2FA intervention is required.

---

## 8. Technical Architecture

| Layer | Component | Technology |
|---|---|---|
| **The Brain** | Orchestrator & Reasoning | FastAPI + GPT-4o / Claude 3.5 Sonnet |
| **The Hands** | Browser Execution | `browser-use` + Playwright on TinyFish Remote Infra |
| **The Eyes** | UI Resilience | Vision-Language Models (VLM) for form identification |
| **The Memory** | Session & Profile State | Redis (sessions) + PostgreSQL (user profiles) |
| **Frontend** | UI & Animations | React (Vite) + Tailwind CSS + Framer Motion |
| **Agent Logic** | Orchestration Framework | LangChain / CrewAI |
| **Search** | Open Web Retrieval | Serper.dev + Direct Scrapers |
| **Streaming** | Agent Visibility | WebSockets / Server-Sent Events (SSE) |

---

## 9. Implementation Roadmap: The Vertical Slice

| Phase | Timeline | Goal |
|---|---|---|
| **Phase 1 — The Core** | H+4 | Build the "Golden Path" — one prompt leads to one successful ferry booking selection (SG → Batam). |
| **Phase 2 — The Vibe** | H+8 | Implement the Cinematic UI and WebSocket "Thinking Trace" animation. |
| **Phase 3 — The Trust** | H+12 | Add the Social Scout (Reddit/X) and integrate "Live" badges into the Bento Grid. |
| **Phase 4 — The Agent** | H+18 | Finalize the Execution HUD with form-filling automation and the MFA Bridge modal. |
| **Phase 5 — The Pitch** | H+20 | Record demo video and finalise pitch deck. |

---

## 10. Future Roadmap

### 10.1 The Living Itinerary (Trip Planning)
Dynamic, minute-by-minute orchestration. **Self-Healing Logic:** if the agent scrapes news of a venue closure or a rain alert, it automatically finds a replacement and updates the schedule.

### 10.2 Autonomous Payments
Integration with virtual card providers (e.g., Stripe Issuing) for 100% hands-free checkout, closing the full loop from discovery to payment.

### 10.3 Vibe-Based Last Mile Optimizer
Scrapes local news and Reddit for road closures (e.g., marathons, construction) and moves car rental pickup locations to the most efficient "on-the-way" spot.

### 10.4 Vision-Based Resilience
Agents use VLMs to "see" the screen and re-identify booking buttons if a website updates its HTML — zero developer intervention required for site UI changes.

### 10.5 The "Go Anywhere" Engine
A Skyscanner-style "Everywhere" feature extended to trains, ferries, and buses. Agents generate destination candidates from a budget input and scrape prices across all modalities simultaneously using parallel TinyFish browser instances.

### 10.6 Shadow Booking & Sentry Mode
Post-booking: 24/7 background monitoring of the Open Web. If a delay, cancellation, or weather warning is scraped, the agent proactively finds alternatives and prompts the user: *"Your ferry is likely delayed — should I book the backup bus route?"*

---

## 11. Competitive Positioning

| Capability | Expedia / Skyscanner | Traditional Travel Agency | **OpenVoyage** |
|---|---|---|---|
| Regional transport (ferries, KTM) | ❌ No API coverage | ✅ Manual lookup | ✅ Browser-scraped live |
| "Ground Truth" social validation | ❌ | ❌ | ✅ Reddit/X Sentinel |
| Autonomous booking execution | ❌ | ❌ | ✅ Playwright form-fill |
| 24/7 post-booking monitoring | ❌ | ❌ | ✅ Live Sentry |
| Commission bias | ✅ Partner-dependent | ✅ Commission-based | ✅ Agnostic / open web |

---

*Document Owner: OpenVoyage Team*
*Last Updated: TinyFish SG Hackathon 2026*