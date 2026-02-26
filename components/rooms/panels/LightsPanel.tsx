"use client";

import { useState, useEffect } from "react";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
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
  const optimisticUpdate = useRoomStore((s) => s.optimisticUpdate);
  const currentLights = useRoomStore((s) => s.rooms[roomId]?.lights);
  const serverOnline = useUIStore((s) => s.serverOnline);
  const isOn = entity?.state === "on";
  const [brightness, setBrightness] = useState(getBrightnessPct(entity));

  useEffect(() => {
    setBrightness(getBrightnessPct(entity));
  }, [entity]);

  const callLight = (payload: { on: boolean; brightness?: number }) => {
    // Optimistic: update store instantly
    if (currentLights && entity) {
      const newState = payload.on ? "on" : "off";
      optimisticUpdate(roomId, {
        lights: {
          ...currentLights,
          [zone.key]: { ...entity, state: newState },
        },
      });
    }
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
    if (guardOffline(serverOnline)) return;
    callLight({ on: !isOn });
  };

  const handleBrightnessCommit = () => {
    if (guardOffline(serverOnline)) return;
    callLight({ on: true, brightness: brightness });
  };

  return (
    <div className={styles.lightZone} style={{ opacity: serverOnline ? 1 : 0.5, cursor: serverOnline ? "default" : "not-allowed" }}>
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
