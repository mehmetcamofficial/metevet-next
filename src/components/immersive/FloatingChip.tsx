import type { ReactNode } from "react";

type FloatingChipProps = {
  children: ReactNode;
  className?: string;
};

/** Decorative glass chip for hero credentials / labels. */
export function FloatingChip({ children, className = "" }: FloatingChipProps) {
  return (
    <div
      className={`glass-pill inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#123A30] shadow-[0_8px_24px_rgba(13,41,34,0.08)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
