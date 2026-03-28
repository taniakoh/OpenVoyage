"use client";

const nodes = [
  { label: "NLP", offset: "translate-x-0" },
  { label: "TF", offset: "translate-x-10" },
  { label: "GT", offset: "-translate-x-8" }
];

export function ThinkingTrace() {
  return (
    <div className="pointer-events-none fixed right-10 top-36 hidden flex-col gap-8 lg:flex">
      {nodes.map((node, index) => (
        <div
          style={{ animationDelay: `${index * 0.45}s` }}
          className={`flex items-center gap-4 ${node.offset}`}
          key={node.label}
          data-thinking-trace
        >
          <div className="glass-chip flex h-10 w-10 items-center justify-center rounded-full font-mono text-xs text-cyan-300">
            {node.label}
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-cyan-300/50 to-transparent" />
        </div>
      ))}
    </div>
  );
}
