"use client";

import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets, Thermometer } from "lucide-react";
import styles from "./overview.module.css";

// HA weather condition → Greek label map
const CONDITION_LABELS: Record<string, string> = {
  "clear-night": "Αίθριος (νύχτα)",
  "cloudy": "Συννεφιά",
  "exceptional": "Ακραίες συνθήκες",
  "fog": "Ομίχλη",
  "hail": "Χαλάζι",
  "lightning": "Κεραυνοί",
  "lightning-rainy": "Καταιγίδα",
  "partlycloudy": "Μερική συννεφιά",
  "pouring": "Καταρρακτώδης βροχή",
  "rainy": "Βροχή",
  "snowy": "Χιόνι",
  "snowy-rainy": "Χιονόβροχο",
  "sunny": "Αίθριος",
  "windy": "Αέρας",
  "windy-variant": "Αέρας με σύννεφα",
};

function conditionIcon(condition: string) {
  if (condition.includes("rain") || condition.includes("pouring")) {
    return <CloudRain size={40} strokeWidth={1.5} />;
  }
  if (condition.includes("snow") || condition.includes("hail")) {
    return <CloudSnow size={40} strokeWidth={1.5} />;
  }
  if (condition.includes("lightning")) {
    return <CloudLightning size={40} strokeWidth={1.5} />;
  }
  if (condition.includes("cloud") || condition.includes("fog")) {
    return <Cloud size={40} strokeWidth={1.5} />;
  }
  // sunny, clear-night, windy, etc.
  return <Sun size={40} strokeWidth={1.5} />;
}

interface WeatherEntity {
  state: string;
  attributes: {
    temperature?: number;
    humidity?: number;
    apparent_temperature?: number;
    temperature_unit?: string;
    [key: string]: unknown;
  };
}

interface WeatherResponse {
  weather: WeatherEntity | null;
}

export function WeatherWidget() {
  const { data, isLoading } = useQuery<WeatherResponse>({
    queryKey: ["weather"],
    queryFn: () => fetch("/api/weather").then((r) => r.json()),
    staleTime: 5 * 60 * 1000, // 5 min — matches server cache
    refetchInterval: 5 * 60 * 1000,
  });

  const entity = data?.weather ?? null;

  return (
    <div className={styles.weatherCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Καιρός — Θεσσαλονίκη</span>
      </div>
      <div className={styles.cardBody}>
        {isLoading && (
          <div className={styles.weatherUnavailable}>Φόρτωση...</div>
        )}
        {!isLoading && !entity && (
          <div className={styles.weatherUnavailable}>
            Δεν υπάρχουν διαθέσιμα δεδομένα καιρού
          </div>
        )}
        {!isLoading && entity && (
          <>
            <div className={styles.weatherMain}>
              <div className={styles.weatherIcon}>
                {conditionIcon(entity.state)}
              </div>
              <div>
                <div className={styles.weatherTemp}>
                  {entity.attributes.temperature !== undefined
                    ? `${Math.round(entity.attributes.temperature)}°`
                    : "—°"}
                </div>
                <div className={styles.weatherCondition}>
                  {CONDITION_LABELS[entity.state] ?? entity.state}
                </div>
              </div>
            </div>

            {(entity.attributes.humidity !== undefined ||
              entity.attributes.apparent_temperature !== undefined) && (
              <div className={styles.weatherMeta}>
                {entity.attributes.humidity !== undefined && (
                  <div className={styles.weatherMetaItem}>
                    <Droplets size={13} />
                    <span>Υγρασία</span>
                    <span className={styles.weatherMetaValue}>
                      {Math.round(entity.attributes.humidity)}%
                    </span>
                  </div>
                )}
                {entity.attributes.apparent_temperature !== undefined && (
                  <div className={styles.weatherMetaItem}>
                    <Thermometer size={13} />
                    <span>Αίσθηση</span>
                    <span className={styles.weatherMetaValue}>
                      {Math.round(entity.attributes.apparent_temperature as number)}°
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
