export function SocialCard({ headline }: { headline: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: "#0D2922",
        color: "#FFFFFF",
        padding: "76px 82px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ display: "flex", width: 10, height: "100%", background: "#CDA85F", marginRight: 54 }} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="112" height="112" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="14" fill="#F4F0E8" />
            <path d="M12 45V18l14 17 13-17v27" fill="none" stroke="#CDA85F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M36 18l10 27 10-27" fill="none" stroke="#123A30" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
            <div style={{ display: "flex", fontSize: 48, fontWeight: 700, letterSpacing: 1 }}>MeteVet</div>
            <div style={{ display: "flex", marginTop: 8, color: "#DDE9E3", fontSize: 19, fontWeight: 600, letterSpacing: 4 }}>VETERINARY CLINIC</div>
          </div>
        </div>
        <div style={{ display: "flex", maxWidth: 850, marginTop: 54, fontSize: 62, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>{headline}</div>
        <div style={{ display: "flex", marginTop: 44, color: "#CDA85F", fontSize: 24, fontWeight: 600, letterSpacing: 2 }}>metevet.com.tr</div>
      </div>
    </div>
  );
}
