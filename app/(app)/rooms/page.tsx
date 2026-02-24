"use client";

import dynamic from "next/dynamic";

// Avoid SSR hydration issues with Zustand stores
// Note: next/dynamic with ssr:false must be in a Client Component (Turbopack requirement)
const RoomGrid = dynamic(
  () => import("@/components/rooms/RoomGrid").then((m) => ({ default: m.RoomGrid })),
  { ssr: false }
);

export default function RoomsPage() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <RoomGrid />
    </div>
  );
}
