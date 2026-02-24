"use client";

import { useState, useEffect } from "react";
import type { HAEntityState } from "@/lib/ha/types";
import type { RoomState } from "@/lib/ha/types";
import styles from "../rooms.module.css";

interface LightsPanelProps {
  roomId: string;
  lights: RoomState["lights"];
}

type ZoneKey = keyof RoomState["lights"];

const ZONES: { key: ZoneKey; label: string; apiPath: string }[] = [
  { key: "ceiling", label: "Οροφή",       apiPath: "ceiling" },
  { key: "side1",   label: "Πλαϊνό 1",    apiPath: "side1"   },
  { key: "side2",   label: "Πλαϊνό 2",    apiPath: "side2"   },
  { key: "ambient", label: "Περιβάλλον",   apiPath: "ambient" },
];

function getBrightnessPct(entity: HAEntityState | null): number {
  if (!entity) return 0;
  if (entity.attributes.brightness_pct != null) {
    return Number(entity.attributes.brightness_pct);
  }
  if (entity.attributes.brightness != null) {
    return Math.round((Number(entity.attributes.brightness) / 255) * 100);
  }
  return entity.state === "on" ? 100 : 0;
}

function LightZone({
  roomId,
  zone,
  entity,
}: {
  roomId: string;
  zone: { key: ZoneKey; label: string; apiPath: string };
  entity: HAEntityState | null;
}) {
  const isOn = entity?.state === "on";
  const [brightness, setBrightness] = useState(getBrightnessPct(entity));

  useEffect(() => {
    setBrightness(getBrightnessPct(entity));
  }, [entity]);

  const callLight = (payload: { on: boolean; brightness?: number }) => {
    fetch(`/api/rooms/${roomId}/lights/${zone.apiPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Αποτυχία σύνδεσης φωτιστικών", type: "error" },
        })
      );
    });
  };

  const handleToggle = () => {
    callLight({ on: !isOn });
  };

  const handleBrightnessCommit = () => {
    callLight({ on: true, brightness: brightness });
  };

  return (
    <div className={styles.lightZone}>
      <label className={styles.toggle} aria-label={`${zone.label} ${isOn ? "ανοιχτό" : "κλειστό"}`}>
        <input
          type="checkbox"
          checked={isOn}
          onChange={handleToggle}
        />
        <span className={styles.toggleSlider} />
      </label>
      <span className={styles.lightZoneName}>{zone.label}</span>
      <input
        type="range"
        className={styles.lightSlider}
        min={1}
        max={100}
        value={brightness}
        disabled={!isOn}
        onChange={(e) => setBrightness(Number(e.target.value))}
        onMouseUp={handleBrightnessCommit}
        onTouchEnd={handleBrightnessCommit}
        aria-label={`Φωτεινότητα ${zone.label}: ${brightness}%`}
        style={{ opacity: isOn ? 1 : 0.4 }}
      />
      <span style={{ fontSize: "11px", color: "var(--ink-4)", minWidth: "32px", textAlign: "right" }}>
        {brightness}%
      </span>
    </div>
  );
}

export function LightsPanel({ roomId, lights }: LightsPanelProps) {
  return (
    <div>
      {ZONES.map((zone) => (
        <LightZone
          key={zone.key}
          roomId={roomId}
          zone={zone}
          entity={lights[zone.key]}
        />
      ))}
    </div>
  );
}
