import { BookingHudClient } from "@/components/booking-hud-client";
import { defaultGatewayPrompt } from "@/lib/open-voyage-data";

type BookingHudPageProps = {
  searchParams?: {
    prompt?: string;
  };
};

export default function BookingHudPage({ searchParams }: BookingHudPageProps) {
  return <BookingHudClient prompt={searchParams?.prompt || defaultGatewayPrompt} />;
}
