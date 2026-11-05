import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/seo";

/** Preview card shown when a Streamflo link is shared (WhatsApp, Facebook, X, LinkedIn). */
export const alt = "Streamflo: find schools in Kenya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #1e2fae 0%, #161d53 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 44, fontWeight: 700 }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, background: "#10b981", marginRight: 18 }} />
          Streamflo
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>Find schools in Kenya</div>
          <div style={{ fontSize: 34, marginTop: 24, color: "#c7d2fe" }}>
            Compare schools in all 47 counties. CBE notes and study tools for learners.
          </div>
        </div>
        <div style={{ fontSize: 28, color: "#a5b4fc" }}>{new URL(SITE_URL).host}</div>
      </div>
    ),
    size
  );
}
