import { BottomHud, ScenicBackdrop, TopBar } from "@/components/cinematic-ui";
import { SignalStreamClient } from "@/components/signal-stream-client";
import { defaultGatewayPrompt } from "@/lib/open-voyage-data";

type SignalStreamPageProps = {
  searchParams?: {
    prompt?: string;
  };
};

export default function SignalStreamPage({ searchParams }: SignalStreamPageProps) {
  const prompt = searchParams?.prompt || defaultGatewayPrompt;

  return (
    <>
      <ScenicBackdrop />
      <TopBar active="explore" showSearch />

      <main className="relative px-6 pb-24 pt-36 md:px-12 lg:px-20">
        <section className="mx-auto max-w-[1180px]">
          <header className="mb-14 max-w-3xl">
            <h1 className="font-headline text-6xl font-light leading-none text-white md:text-[5.5rem]">
              The <span className="italic text-white/80">Signal Stream</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              OpenVoyage is now showing the full workflow live: the OpenAI planning phase, every TinyFish browser agent, and the final ranked route from one shared event stream.
            </p>
          </header>

          <SignalStreamClient prompt={prompt} />
        </section>
      </main>

      <BottomHud
        center={<span className="rounded-full border border-cyan-300/25 px-3 py-1 text-cyan-300">Next: Concierge Brief</span>}
        left="Scout stream active. Ranking routes and validating queues."
        signal="98.4%"
      />
    </>
  );
}
