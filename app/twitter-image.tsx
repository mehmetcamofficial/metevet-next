import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #123A30 0%, #0D2922 100%)",
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
        <div style={{ fontSize: 40, letterSpacing: 4, textTransform: "uppercase", opacity: 0.82 }}>MeteVet</div>
        <div style={{ fontSize: 62, fontWeight: 700, marginTop: 18, lineHeight: 1.1 }}>Compassionate care. Modern medicine.</div>
      </div>
    ),
    { ...size },
  );
}
