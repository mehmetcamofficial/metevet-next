import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0D2922 0%, #123A30 40%, #DDE9E3 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 32, letterSpacing: 6, textTransform: "uppercase", opacity: 0.9 }}>MeteVet</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>Premium veterinary care for modern pet families.</div>
        <div style={{ fontSize: 28, marginTop: 24, opacity: 0.88 }}>Kuşadası • Preventive care • Diagnostics • Compassionate treatment</div>
      </div>
    ),
    { ...size },
  );
}
