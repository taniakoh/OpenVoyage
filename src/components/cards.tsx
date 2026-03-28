import { ReactNode } from "react";

export function GlassCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-panel rounded-[28px] p-6 ${className}`}>{children}</div>;
}
