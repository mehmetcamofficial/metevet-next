import { ImageResponse } from "next/og";
import { SocialCard } from "@/src/components/brand/social-card";

export const runtime = "edge";
export const alt = "MeteVet Veterinary Clinic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<SocialCard headline="Trusted veterinary care, guided by science." />, { ...size });
}
