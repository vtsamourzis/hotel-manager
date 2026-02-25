"use client";

import dynamic from "next/dynamic";

const HotWaterPage = dynamic(
  () => import("@/components/hotwater/HotWaterPage"),
  { ssr: false }
);

export default function HotWaterRoute() {
  return <HotWaterPage />;
}
