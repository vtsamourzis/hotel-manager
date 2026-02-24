"use client";

import type { Session } from "next-auth";
import { WeatherWidget } from "./WeatherWidget";
import { AlertBar } from "./AlertBar";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { MiniRoomGrid } from "./MiniRoomGrid";
import styles from "./overview.module.css";

interface OverviewPageProps {
  session: Session;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Καλημέρα";
  return "Καλησπέρα";
}

export function OverviewPage({ session }: OverviewPageProps) {
  const firstName = session.user?.name?.split(" ")[0] ?? "Manager";
  const greeting = getGreeting();
  const dateStr = new Date().toLocaleDateString("el-GR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div style={{ padding: "26px 24px 48px" }}>
      {/* Greeting header */}
      <div className={styles.header}>
        <h1 className={styles.greeting}>
          {greeting}, {firstName}
        </h1>
        <p className={styles.dateLabel}>{dateStr}</p>
      </div>

      {/* 4-section overview grid */}
      <div className={styles.overviewGrid}>
        {/* Row 1: Weather + Alerts */}
        <WeatherWidget />
        <AlertBar />

        {/* Row 2: Schedule timeline (full width) */}
        <ScheduleTimeline />

        {/* Row 3: Mini room grid (full width) */}
        <MiniRoomGrid />
      </div>

      {/* RoomDetailPanel rendered here — created in plan 02-05 */}
      {/* Once 02-05 is complete, import and render:
          <RoomDetailPanel />
          The panel reads selectedRoomId from UIStore and shows as overlay.
      */}
    </div>
  );
}
