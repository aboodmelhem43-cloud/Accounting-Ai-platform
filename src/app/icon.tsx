import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#1d4ed8",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 22,
          fontStyle: "italic",
          fontFamily: "Georgia, serif",
          fontWeight: 700,
        }}
      >
        m
      </div>
    ),
    { width: 32, height: 32 }
  );
}
