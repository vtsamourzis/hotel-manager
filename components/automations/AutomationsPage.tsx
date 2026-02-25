"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAutomationsStore } from "@/lib/store/automations-store";
import { AutomationCard } from "./AutomationCard";
import { ActivityLog } from "./ActivityLog";
import { NewAutomationPanel } from "./NewAutomationPanel";
import styles from "./automations.module.css";

interface LogEntry {
  timestamp: string;
  automationId: string;
  automationLabel: string;
  detail: string;
  room?: string;
}

export default function AutomationsPage() {
  const automations = useAutomationsStore((s) => s.automations);
  const [showNewPanel, setShowNewPanel] = useState(false);

  const enabledCount = useMemo(
    () => automations.filter((a) => a.enabled).length,
    [automations]
  );
  const disabledCount = automations.length - enabledCount;

  // Fetch log data for "today executions" stat and to pass to ActivityLog
  const { data: logData } = useQuery<{ entries: LogEntry[] }>({
    queryKey: ["automations-log"],
    queryFn: () => fetch("/api/automations/log").then((r) => r.json()),
    refetchOnWindowFocus: true,
  });

  const todayCount = useMemo(() => {
    if (!logData?.entries) return 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return logData.entries.filter(
      (e) => new Date(e.timestamp) >= todayStart
    ).length;
  }, [logData]);

  return (
    <div className={`${styles.automationsPage} page-scroll`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Αυτοματισμοί</h1>
        <button
          className={styles.newBtn}
          onClick={() => setShowNewPanel(true)}
        >
          Νέος Αυτοματισμός
        </button>
      </div>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        <span className={styles.statPill}>
          Ενεργοί: <strong>{enabledCount}</strong>
        </span>
        <span className={styles.statPill}>
          Ανενεργοί: <strong>{disabledCount}</strong>
        </span>
        <span className={styles.statPill}>
          Εκτελέσεις σήμερα: <strong>{todayCount}</strong>
        </span>
      </div>

      {/* Automation grid */}
      <div className={styles.grid}>
        {automations.map((automation) => (
          <AutomationCard key={automation.id} automation={automation} />
        ))}
      </div>

      {/* Activity log */}
      <ActivityLog entries={logData?.entries} />

      {/* New automation panel */}
      <NewAutomationPanel
        open={showNewPanel}
        onClose={() => setShowNewPanel(false)}
      />
    </div>
  );
}
