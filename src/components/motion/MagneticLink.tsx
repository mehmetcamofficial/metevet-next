/**
 * MeteVet Global Motion Design System — MagneticLink
 *
 * Subtle magnetic hover for links/buttons (desktop pointer only).
 * Disabled on reduced-motion and touch / mobile widths.
 */

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { BREAKPOINTS, HOVER_ARROW_X } from "./motion-config";
import { useReducedMotion } from "./useReducedMotion";

type MagneticLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
  external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className">;

export function MagneticLink({
  href,
  children,
  className = "",
  strength = HOVER_ARROW_X,
  external = false,
  onMouseMove,
  onMouseLeave,
  ...rest
}: MagneticLinkProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current =
      !reduced &&
      typeof window !== "undefined" &&
      window.innerWidth >= BREAKPOINTS.mobile &&
      window.matchMedia("(pointer: fine)").matches;
  }, [reduced]);

  const handleMove = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onMouseMove?.(event);
      if (!enabledRef.current || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength * 2;
      ref.current.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    },
    [onMouseMove, strength],
  );

  const handleLeave = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onMouseLeave?.(event);
      if (!ref.current) return;
      ref.current.style.transform = "translate3d(0, 0, 0)";
    },
    [onMouseLeave],
  );

  const shared = {
    ref,
    className: `inline-flex transition-transform duration-300 ease-out will-change-transform ${className}`,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    ...rest,
  };

  if (external || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a href={href} {...shared}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...shared}>
      {children}
    </Link>
  );
}
