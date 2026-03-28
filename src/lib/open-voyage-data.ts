export const navItems = [
  { href: "/", label: "Gateway" },
  { href: "/signal-stream", label: "Signal Stream" },
  { href: "/mission-control", label: "Mission Control" },
  { href: "/discovery-report", label: "Discovery Report" },
  { href: "/booking-hud", label: "Booking HUD" }
] as const;

export const defaultGatewayPrompt =
  "Find me the quietest Batam ferry from Singapore tomorrow morning, keep it affordable, and verify checkpoint conditions with Reddit and local news.";

export const supportedSources = [
  "Reddit",
  "Local news",
  "Batam Fast",
  "Majestic Fast Ferry",
  "KTM",
  "Budget airlines"
] as const;

export const signalHighlights = [
  {
    eyebrow: "Scout Coverage",
    title: "3 live sources checked",
    description: "Batam Fast, Majestic Fast Ferry, and Reddit were all scanned before the route was ranked."
  },
  {
    eyebrow: "Best Route",
    title: "05:40 Batam Centre ferry",
    description: "Earliest calm departure with confirmed seats and lower checkpoint congestion."
  },
  {
    eyebrow: "Ground Truth",
    title: "CLEAR social signal",
    description: "Recent traveler chatter shows normal queues and no disruption spikes in the last 24 hours."
  }
] as const;

export const missionEvents = [
  {
    title: "Booking confirmed",
    time: "08:00 AM",
    description: "Ferry reservation was completed and the confirmation reference was saved to the itinerary.",
    status: "complete"
  },
  {
    title: "Checkpoint monitoring active",
    time: "08:32 AM",
    description: "OpenVoyage is watching Reddit, local alerts, and operator updates for queue changes before departure.",
    status: "active"
  },
  {
    title: "Departure reminder",
    time: "09:45 AM",
    description: "Traveler gets a final reminder with terminal, check-in window, and fallback guidance if delays appear.",
    status: "upcoming"
  }
] as const;

export const discoveryBullets = [
  "Intent parsing preserves destination, preferred modes, and scout queries so the brief stays traceable to the original request.",
  "Ground-truth scoring weights social chatter and booking friction together, not just price, before the route is promoted.",
  "The execution handoff remains human-in-the-loop with an MFA bridge and explicit confirm-payment stop."
] as const;

export const discoveryRoutes = [
  {
    id: "dawn-ferry",
    title: "Dawn Ferry Transfer",
    departure: "05:40 SGT",
    duration: "58 min",
    fare: "$38",
    confidence: "94.2%",
    note:
      "Picked because the early departure clears checkpoint compression before commuter traffic spikes and social chatter stays consistently calm.",
    verified: true,
    sources: ["Reddit", "Checkpoint Watch", "TinyFish"]
  },
  {
    id: "harbor-rail",
    title: "Harbor Rail Connection",
    departure: "06:10 SGT",
    duration: "1h 14m",
    fare: "$31",
    confidence: "89.6%",
    note:
      "Slightly slower, but the transfer chain remains resilient when ferry queues slip and the station sentiment remains neutral.",
    verified: false,
    sources: ["TinyFish", "Transit Feed"]
  },
  {
    id: "soft-landing",
    title: "Soft Landing Backup",
    departure: "07:05 SGT",
    duration: "1h 21m",
    fare: "$29",
    confidence: "82.4%",
    note:
      "Held as a contingency route because it trades speed for reliability and leaves more recovery room if verification starts appearing.",
    verified: false,
    sources: ["TinyFish", "Fare Scout"]
  }
] as const;

export const sentryVerification = {
  label: "Live Sentry",
  status: "CLEAR",
  summary:
    "Social scout confirms calm queues, no active delay clusters, and a stable checkpoint window over the last 90 minutes.",
  checks: [
    "Checkpoint mentions trending down 18%",
    "No disruption keywords in the latest scout pass",
    "Primary route matches booking-site availability"
  ]
} as const;

export const vibeMap = {
  image: "/stitch/openvoyage-basin.jpg",
  alt: "Mountain basin overview used as the destination vibe map",
  tags: [
    { label: "Quiet coves", tone: "positive", top: "16%", left: "12%" },
    { label: "Misty sunrise", tone: "positive", top: "30%", left: "62%" },
    { label: "Low foot traffic", tone: "positive", top: "58%", left: "22%" },
    { label: "Check-in smooth", tone: "neutral", top: "70%", left: "66%" }
  ]
} as const;

export const discoverySignals = [
  {
    label: "Scout consensus",
    value: "3 of 3 aligned"
  },
  {
    label: "Sentiment drift",
    value: "-12% congestion"
  },
  {
    label: "Booking friction",
    value: "Low"
  }
] as const;

export const evidenceSummary = {
  sourceCount: "5 Reddit threads, 2 local reports, 2 operator checks",
  verdict: "CLEAR",
  citedSignals: [
    "Reddit queue complaints have dropped over the last 90 minutes.",
    "Operator timetable still shows the 05:40 Batam Centre departure as available.",
    "No weather or port disruption alerts were detected for the selected window."
  ]
} as const;

export const agencyComparison = [
  { label: "OpenVoyage", fare: "$38", duration: "58 min", note: "Early ferry, lower queue risk" },
  { label: "Typical aggregator", fare: "$44", duration: "1h 15m", note: "Later departure, no live queue check" }
] as const;

export const bookingSession = {
  site: "batamfast.com",
  route: "Singapore HarbourFront -> Batam Centre",
  departure: "29 Mar 2026, 05:40 SGT",
  passenger: "Primary traveler profile loaded"
} as const;

export const bookingSteps = [
  { label: "Details", state: "complete" },
  { label: "Seats", state: "complete" },
  { label: "Payment", state: "active" }
] as const;

export const liveSiteFields = [
  { label: "Current page", value: "Passenger details review" },
  { label: "Operator", value: "Batam Fast Ferry" },
  { label: "Status", value: "Waiting for SMS code" }
] as const;

export const missionAlert = {
  title: "Proactive Alert",
  summary: "Checkpoint chatter is still calm, but rain risk has increased slightly near departure. A re-scan is available if conditions change.",
  action: "Review backup options"
} as const;

export const missionStats = [
  { label: "Route status", value: "On time" },
  { label: "Queue signal", value: "Low" },
  { label: "Backup route", value: "Prepared" }
] as const;
