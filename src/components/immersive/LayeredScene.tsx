/**
 * Layered depth scene with decorative atmosphere (aria-hidden).
 */

import type { ReactNode } from "react";

type LayeredSceneProps = {
  children: ReactNode;
  className?: string;
  /** Soft gold bloom */
  bloom?: boolean;
  /** Forest secondary bloom */
  forestBloom?: boolean;
};

export function LayeredScene({
  children,
  className = "",
  bloom = true,
  forestBloom = true,
}: LayeredSceneProps) {
  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      {bloom ? (
        <div
          aria-hidden="true"
          className="immersive-bloom pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#CDA85F]/18 blur-3xl"
        />
      ) : null}
      {forestBloom ? (
        <div
          aria-hidden="true"
          className="immersive-bloom pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-[#123A30]/12 blur-3xl"
        />
      ) : null}
      <div aria-hidden="true" className="immersive-grain pointer-events-none absolute inset-0 opacity-[0.035]" />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
