import { BookingHudExperience } from "@/components/booking-hud-experience";
import { loadBookingHudPayload } from "@/lib/booking-hud";

export default async function BookingHudPage() {
  const payload = await loadBookingHudPayload();

  return <BookingHudExperience payload={payload} />;
}
