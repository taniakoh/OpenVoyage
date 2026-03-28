import { getSearchSnapshot } from "@/lib/search";
import { createClient } from "@/utils/supabase/server";

export type BookingTravelerProfile = {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber: string;
  emergencyContact: string;
};

export type BookingFieldMapping = {
  label: string;
  selector: string;
  value: string;
  source: string;
  status: "ready" | "pending";
};

export type BookingHudPayload = {
  traveler: BookingTravelerProfile;
  route: {
    destination: string;
    departureWindow: string;
    fareHold: string;
    operator: string;
    bookingUrl: string;
  };
  portal: {
    targetUrl: string;
    websocketUrl: string;
    viewportLabel: string;
  };
  liveSteps: readonly {
    title: string;
    detail: string;
    status: "complete" | "active" | "pending";
  }[];
  fieldMappings: BookingFieldMapping[];
  mfaHint: string;
};

const defaultPrompt =
  "Find me the quietest Batam ferry from Singapore tomorrow morning, keep it affordable, and verify checkpoint conditions with Reddit and local news.";

const fallbackTraveler: BookingTravelerProfile = {
  fullName: "Avery Tan",
  email: "avery.tan@openvoyage.dev",
  phone: "+65 8123 5521",
  nationality: "Singapore",
  passportNumber: "E1234567M",
  emergencyContact: "Kai Tan | +65 9001 4409"
};

export async function loadBookingHudPayload(prompt = defaultPrompt): Promise<BookingHudPayload> {
  const traveler = await loadTravelerProfile();
  const searchSnapshot = await loadSearchSnapshot(prompt);
  const bestRoute = readObject(searchSnapshot?.summary.bestRoute);
  const intent = searchSnapshot?.intent;
  const operator = readOperator(bestRoute) || "BatamFast Ferry";
  const destination = readString(bestRoute?.headline) || `${intent?.destination || "Batam"} Route`;
  const departureWindow = readString(bestRoute?.departure) || "2026-03-29 06:40 SGT";
  const fareHold = readString(bestRoute?.price) || "SGD 38.00";
  const bookingUrl = readString(bestRoute?.booking_url) || "https://www.batamfast.com";

  return {
    traveler,
    route: {
      destination,
      departureWindow,
      fareHold,
      operator,
      bookingUrl
    },
    portal: {
      targetUrl: bookingUrl,
      websocketUrl: buildPortalSocketUrl(bookingUrl),
      viewportLabel: buildViewportLabel(bookingUrl)
    },
    liveSteps: [
      {
        title: "Portal staged",
        detail: `Shadow browser session reserved for ${operator} and waiting for traveler approval at ${readHostLabel(bookingUrl)}.`,
        status: "complete"
      },
      {
        title: "Form injection lane",
        detail: "Traveler profile data is mapped to checkout selectors and pauses on sensitive verification screens.",
        status: "active"
      },
      {
        title: "Payment hand-off",
        detail: "Final click remains locked until MFA succeeds and the traveler confirms the charge.",
        status: "pending"
      }
    ],
    fieldMappings: [
      {
        label: "Passenger name",
        selector: "input[name='passenger_name']",
        value: traveler.fullName,
        source: "Supabase traveler profile",
        status: "ready"
      },
      {
        label: "Email address",
        selector: "input[type='email']",
        value: traveler.email,
        source: "Supabase traveler profile",
        status: "ready"
      },
      {
        label: "Phone number",
        selector: "input[name='mobile']",
        value: traveler.phone,
        source: "Supabase traveler profile",
        status: "ready"
      },
      {
        label: "Passport number",
        selector: "input[name='passport_number']",
        value: traveler.passportNumber,
        source: "Supabase traveler profile",
        status: traveler.passportNumber ? "ready" : "pending"
      },
      {
        label: "Emergency contact",
        selector: "input[name='emergency_contact']",
        value: traveler.emergencyContact,
        source: "Supabase traveler profile",
        status: traveler.emergencyContact ? "ready" : "pending"
      }
    ],
    mfaHint: "Code expected from the ferry operator checkout challenge."
  };
}

async function loadSearchSnapshot(prompt: string) {
  try {
    return await getSearchSnapshot(prompt);
  } catch {
    return null;
  }
}

async function loadTravelerProfile(): Promise<BookingTravelerProfile> {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return fallbackTraveler;
    }

    const record = await findProfileRecord(supabase, user.id);

    return {
      fullName: readProfileValue(record, ["full_name", "name", "display_name"]) || fallbackTraveler.fullName,
      email: user.email || readProfileValue(record, ["email"]) || fallbackTraveler.email,
      phone: readProfileValue(record, ["phone", "phone_number", "mobile"]) || fallbackTraveler.phone,
      nationality: readProfileValue(record, ["nationality", "country"]) || fallbackTraveler.nationality,
      passportNumber:
        readProfileValue(record, ["passport_number", "passportNo", "passport"]) || fallbackTraveler.passportNumber,
      emergencyContact:
        readProfileValue(record, ["emergency_contact", "emergencyContact", "next_of_kin"]) ||
        fallbackTraveler.emergencyContact
    };
  } catch {
    return fallbackTraveler;
  }
}

async function findProfileRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Record<string, unknown> | null> {
  const candidates = ["traveler_profiles", "profiles", "passenger_profiles"] as const;

  for (const table of candidates) {
    const { data, error } = await supabase.from(table).select("*").eq("id", userId).maybeSingle();

    if (!error && data && typeof data === "object") {
      return data as Record<string, unknown>;
    }
  }

  return null;
}

function readProfileValue(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return "";
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readOperator(route: Record<string, unknown> | null) {
  const bookingUrl = readString(route?.booking_url);

  if (bookingUrl.includes("batamfast")) {
    return "BatamFast Ferry";
  }

  if (bookingUrl.includes("directferries")) {
    return "Direct Ferries";
  }

  if (bookingUrl.includes("ktmb")) {
    return "KTM Shuttle";
  }

  if (bookingUrl.includes("google.com/travel/flights")) {
    return "Google Flights";
  }

  return "";
}

function readHostLabel(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "booking operator";
  }
}

function buildPortalSocketUrl(url: string) {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//shadow.openvoyage.local/session?target=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return "wss://shadow.openvoyage.local/session";
  }
}

function buildViewportLabel(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.host.replace(/^www\./, "")}${path}`;
  } catch {
    return "checkout";
  }
}
