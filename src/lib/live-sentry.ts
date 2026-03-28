export type LiveSentryAlert = {
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  impact: string;
  recommendation: string;
  detectedAt: string;
};

export type LiveSentryTimelineEvent = {
  id: string;
  title: string;
  time: string;
  description: string;
  status: "complete" | "active" | "upcoming" | "alert";
  metrics?: Array<{
    label: string;
    value: string;
  }>;
};

export type LiveSentrySnapshot = {
  itinerary: {
    id: string;
    route: string;
    status: string;
    window: string;
    destination: string;
    operator: string;
  };
  refreshedAt: string;
  nextRefreshAt: string;
  intervalMinutes: number;
  syncStrength: number;
  summary: string;
  socialPulse: {
    sentiment: string;
    queueDelta: string;
    chatterVelocity: string;
    confidence: string;
    source: string;
  };
  timeline: LiveSentryTimelineEvent[];
  alert: LiveSentryAlert | null;
};

const REFRESH_INTERVAL_MINUTES = 30;

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Singapore"
  }).format(date);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function resolveScenario(now: Date, forcedScenario?: string) {
  if (forcedScenario === "stable" || forcedScenario === "watch" || forcedScenario === "delay") {
    return forcedScenario;
  }

  const bucket = Math.floor(now.getTime() / (REFRESH_INTERVAL_MINUTES * 60 * 1000)) % 3;
  return ["stable", "watch", "delay"][bucket] as "stable" | "watch" | "delay";
}

export function buildLiveSentrySnapshot(forcedScenario?: string): LiveSentrySnapshot {
  const now = new Date();
  const nextRefreshAt = addMinutes(now, REFRESH_INTERVAL_MINUTES);
  const scenario = resolveScenario(now, forcedScenario);

  const baseTimeline: LiveSentryTimelineEvent[] = [
    {
      id: "intent",
      title: "Intent Locked",
      time: "05:12 AM",
      description: "Traveler brief parsed into ferry route, quiet-window preference, and verification sources.",
      status: "complete"
    },
    {
      id: "booking",
      title: "Booking Lane Reserved",
      time: "05:26 AM",
      description: "Primary ferry inventory is still visible and the operator lane remains open for final handoff.",
      status: "complete"
    },
    {
      id: "sentry",
      title: "Live Sentry Sweep",
      time: formatClock(now),
      description: "Latest scrape compares queue chatter, checkpoint mentions, and operator stability before the next refresh.",
      status: scenario === "stable" ? "active" : scenario === "watch" ? "active" : "alert",
      metrics:
        scenario === "stable"
          ? [
              { label: "Queue drift", value: "-12%" },
              { label: "Confidence", value: "94%" },
              { label: "Next sweep", value: formatClock(nextRefreshAt) }
            ]
          : scenario === "watch"
            ? [
                { label: "Queue drift", value: "+6%" },
                { label: "Confidence", value: "88%" },
                { label: "Risk", value: "Watch" }
              ]
            : [
                { label: "Delay risk", value: "17 min" },
                { label: "Confidence", value: "91%" },
                { label: "Fallback", value: "Standby" }
              ]
    },
    {
      id: "arrival",
      title: "Terminal Arrival Window",
      time: "06:40 AM",
      description: "Arrival and onward transfer stay ready once the sentry window remains green through the next check.",
      status: scenario === "delay" ? "upcoming" : "active"
    }
  ];

  if (scenario === "stable") {
    return {
      itinerary: {
        id: "OV-BTM-0629",
        route: "HarbourFront -> Batam Centre",
        status: "Stable corridor",
        window: "Boarding in 42 minutes",
        destination: "Batam Centre Terminal",
        operator: "BatamFast"
      },
      refreshedAt: now.toISOString(),
      nextRefreshAt: nextRefreshAt.toISOString(),
      intervalMinutes: REFRESH_INTERVAL_MINUTES,
      syncStrength: 98.4,
      summary: "Social sentiment is calm, checkpoint chatter is thinning, and the primary ferry remains the recommended execution lane.",
      socialPulse: {
        sentiment: "Calm",
        queueDelta: "-12% mentions",
        chatterVelocity: "Low",
        confidence: "94.2%",
        source: "Reddit + checkpoint watch"
      },
      timeline: baseTimeline,
      alert: null
    };
  }

  if (scenario === "watch") {
    return {
      itinerary: {
        id: "OV-BTM-0629",
        route: "HarbourFront -> Batam Centre",
        status: "Watch window",
        window: "Boarding in 42 minutes",
        destination: "Batam Centre Terminal",
        operator: "BatamFast"
      },
      refreshedAt: now.toISOString(),
      nextRefreshAt: nextRefreshAt.toISOString(),
      intervalMinutes: REFRESH_INTERVAL_MINUTES,
      syncStrength: 93.1,
      summary: "Live Sentry sees a small rise in checkpoint chatter, but the route is still viable while we monitor the next sweep.",
      socialPulse: {
        sentiment: "Cautious",
        queueDelta: "+6% mentions",
        chatterVelocity: "Moderate",
        confidence: "88.7%",
        source: "Reddit + local commuter feed"
      },
      timeline: baseTimeline,
      alert: {
        severity: "warning",
        title: "Checkpoint chatter rising",
        summary: "A fresh cluster of commuter posts suggests mild queue build-up near HarbourFront.",
        impact: "Expect a possible 6 to 9 minute slowdown if the next sweep confirms the pattern.",
        recommendation: "Keep the current route live, but prepare the Harbor Rail Connection as fallback.",
        detectedAt: formatClock(now)
      }
    };
  }

  return {
    itinerary: {
      id: "OV-BTM-0629",
      route: "HarbourFront -> Batam Centre",
      status: "Delay detected",
      window: "Boarding in 42 minutes",
      destination: "Batam Centre Terminal",
      operator: "BatamFast"
    },
    refreshedAt: now.toISOString(),
    nextRefreshAt: nextRefreshAt.toISOString(),
    intervalMinutes: REFRESH_INTERVAL_MINUTES,
    syncStrength: 87.6,
    summary: "Live Sentry detected a likely delay cluster and surfaced the route before the booking handoff proceeds.",
    socialPulse: {
      sentiment: "Delayed",
      queueDelta: "+19% mentions",
      chatterVelocity: "High",
      confidence: "91.3%",
      source: "Reddit + operator site + checkpoint watch"
    },
    timeline: [
      ...baseTimeline.slice(0, 3),
      {
        id: "reroute",
        title: "Emergency Reroute Ready",
        time: formatClock(addMinutes(now, 6)),
        description: "Backup departure lane is staged so the agent can self-heal into the quieter route after acknowledgment.",
        status: "active",
        metrics: [
          { label: "Fallback route", value: "Harbor Rail" },
          { label: "Recovered ETA", value: "06:56 AM" },
          { label: "Fare delta", value: "-$7" }
        ]
      },
      baseTimeline[3]
    ],
    alert: {
      severity: "critical",
      title: "Delay cluster confirmed",
      summary: "Multiple fresh posts and the operator lane now point to a boarding slowdown on the primary ferry path.",
      impact: "Projected delay window is 14 to 17 minutes if the current lane is kept.",
      recommendation: "Acknowledge the alert and reroute to the Harbor Rail Connection before payment confirmation.",
      detectedAt: formatClock(now)
    }
  };
}
