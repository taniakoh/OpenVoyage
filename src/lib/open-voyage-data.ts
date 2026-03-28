export const navItems = [
  { href: "/", label: "Gateway" },
  { href: "/signal-stream", label: "Signal Stream" },
  { href: "/mission-control", label: "Mission Control" },
  { href: "/discovery-report", label: "Discovery Report" },
  { href: "/booking-hud", label: "Booking HUD" }
] as const;

export const gatewayPrompts = [
  {
    title: "Quiet ferries from Singapore",
    body: "Find the least chaotic Batam route this weekend, verify with local chatter, and keep it under SGD 120."
  },
  {
    title: "Rail-first highland escape",
    body: "Optimize for scenic transfers, low crowd density, and weather stability across the next 72 hours."
  },
  {
    title: "Fastest checkpoint strategy",
    body: "Scan live bottlenecks, summarize sentiment, and suggest the best departure window for a same-day return."
  }
];

export const resultCards = [
  {
    name: "Batam Quiet Window",
    intelligenceScore: "98.4%",
    detail: "Cross-checking ferry operators, live weather, and 5 community reports shows the 06:40 departure is the calmest route."
  },
  {
    name: "Woodlands Rail Corridor",
    intelligenceScore: "91.1%",
    detail: "TinyFish scouts found lower queue density after 13:20 with stronger punctuality than the morning peak."
  },
  {
    name: "Contingency Lane",
    intelligenceScore: "86.7%",
    detail: "Best fallback if social sentiment worsens or a carrier changes boarding cadence."
  }
];

export const missionEvents = [
  {
    title: "Intent Parsed",
    time: "08:00",
    description: "Structured travel entities extracted and broadcast to the scout mesh.",
    status: "complete"
  },
  {
    title: "TinyFish Scouts Active",
    time: "08:05",
    description: "Browser sessions are traversing ferry, rail, Reddit, and checkpoint sources in parallel.",
    status: "active"
  },
  {
    title: "Execution Window Ready",
    time: "08:14",
    description: "The booking sequence is staged and waiting for final human confirmation.",
    status: "upcoming"
  }
] as const;

export const discoveryBullets = [
  "The quietest corridor consistently appears when social chatter spikes but operator inventory remains steady.",
  "Reddit posts emphasize queue avoidance more than ticket price, so the scoring model weights sentiment and friction together.",
  "A manual confirmation checkpoint is preserved before any payment action, matching the human-in-the-loop requirement."
];

export const bookingFields = [
  { label: "Destination Coordinate", value: "Batam Centre Terminal" },
  { label: "Vessel Grade", value: "Quiet Cabin" },
  { label: "Temporal Sync", value: "2026-03-29 06:40 SGT" },
  { label: "Passenger Profile", value: "Primary traveler profile" }
] as const;
