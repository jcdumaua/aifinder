import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "AiFinder — Discover the Best AI Tools";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 20% 20%, #22d3ee 0, transparent 32%), radial-gradient(circle at 80% 25%, #a855f7 0, transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 55%, #000000 100%)",
          color: "white",
          padding: 72,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 24,
              background: "#22d3ee",
              color: "#020617",
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            AI
          </div>

          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            AiFinder
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              maxWidth: 920,
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
            }}
          >
            Discover the Best AI Tools
          </div>

          <div
            style={{
              maxWidth: 860,
              fontSize: 31,
              lineHeight: 1.35,
              color: "#cbd5e1",
            }}
          >
            Browse AI tools for chatbots, images, videos, writing, coding,
            business, productivity, marketing, SEO, design, and AI agents.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 22,
            fontWeight: 800,
            color: "#020617",
          }}
        >
          {["Chatbots", "Image AI", "Coding", "Business", "AI Agents"].map(
            (item) => (
              <div
                key={item}
                style={{
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.92)",
                  padding: "14px 22px",
                }}
              >
                {item}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
