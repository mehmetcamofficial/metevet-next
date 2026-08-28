/**
 * Thin editorial wrapper around motion Reveal + optional BlurText heading.
 */

import type { ReactNode } from "react";
import { BlurText, Reveal } from "@/src/components/motion";

type EditorialRevealProps = {
  kicker?: string;
  title?: string;
  as?: "h1" | "h2" | "h3";
  titleClassName?: string;
  children?: ReactNode;
  className?: string;
  delay?: number;
};

export function EditorialReveal({
  kicker,
  title,
  as = "h2",
  titleClassName = "mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl",
  children,
  className = "",
  delay = 0,
}: EditorialRevealProps) {
  return (
    <div className={className}>
      {kicker ? (
        <Reveal delay={delay}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{kicker}</p>
        </Reveal>
      ) : null}
      {title ? (
        <BlurText as={as} className={titleClassName} delay={delay + 0.04}>
          {title}
        </BlurText>
      ) : null}
      {children ? (
        <Reveal delay={delay + 0.08} className="mt-5">
          {children}
        </Reveal>
      ) : null}
    </div>
  );
}
