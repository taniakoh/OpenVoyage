import { DiscoveryReportClient } from "@/components/discovery-report-client";
import { defaultGatewayPrompt } from "@/lib/open-voyage-data";

type DiscoveryReportPageProps = {
  searchParams?: {
    prompt?: string;
  };
};

export default function DiscoveryReportPage({ searchParams }: DiscoveryReportPageProps) {
  return <DiscoveryReportClient prompt={searchParams?.prompt || defaultGatewayPrompt} />;
}
