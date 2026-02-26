"use client";

import type { Session } from "next-auth";
import { WeatherWidget } from "./WeatherWidget";
import { AlertBar } from "./AlertBar";
import { NotificationButton } from "./NotificationButton";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { MiniRoomGrid } from "./MiniRoomGrid";
import { RoomDetailPanel } from "@/components/rooms/RoomDetailPanel";
import styles from "./overview.module.css";

interface OverviewPageProps {
  session: Session;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "\u039A\u03B1\u03BB\u03B7\u03BC\u03AD\u03C1\u03B1";
  return "\u039A\u03B1\u03BB\u03B7\u03C3\u03C0\u03AD\u03C1\u03B1";
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
      {/* Hero row: greeting left, weather right */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.greetingRow}>
            <h1 className={styles.greeting}>
              {greeting}, {firstName}
            </h1>
            <div className={styles.greetingBell}>
              <NotificationButton />
            </div>
          </div>
          <p className={styles.dateLabel}>{dateStr}</p>
        </div>
        <WeatherWidget />
      </div>

      {/* Critical alerts — only renders if smoke/leak active */}
      <AlertBar />

      {/* Content sections */}
      <div className={styles.overviewGrid}>
        <ScheduleTimeline />
        <MiniRoomGrid />
      </div>

      <RoomDetailPanel />
    </div>
  );
}
