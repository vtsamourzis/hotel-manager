"use client";

import { useQuery } from "@tanstack/react-query";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets } from "lucide-react";
import styles from "./overview.module.css";

const CONDITION_LABELS: Record<string, string> = {
  "clear-night": "Αίθριος",
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
    return <CloudRain size={42} strokeWidth={1.5} />;
  }
  if (condition.includes("snow") || condition.includes("hail")) {
    return <CloudSnow size={42} strokeWidth={1.5} />;
  }
  if (condition.includes("lightning")) {
    return <CloudLightning size={42} strokeWidth={1.5} />;
  }
  if (condition.includes("cloud") || condition.includes("fog")) {
    return <Cloud size={42} strokeWidth={1.5} />;
  }
  return <Sun size={42} strokeWidth={1.5} />;
}

interface WeatherEntity {
  state: string;
  attributes: {
    temperature?: number;
    humidity?: number;
    wind_speed?: number;
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
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const entity = data?.weather ?? null;

  if (isLoading || !entity) return null;

  return (
    <div className={styles.weatherCard}>
      <div className={styles.weatherIcon}>
        {conditionIcon(entity.state)}
      </div>
      <div>
        <div className={styles.weatherTemp}>
          {entity.attributes.temperature !== undefined
            ? Math.round(entity.attributes.temperature)
            : "—"}
          <span>°C</span>
        </div>
        <div className={styles.weatherCond}>
          {CONDITION_LABELS[entity.state] ?? entity.state}
        </div>
        <div className={styles.weatherStats}>
          {entity.attributes.wind_speed !== undefined && (
            <span className={styles.weatherStat}>
              <Wind size={11} /> {Math.round(entity.attributes.wind_speed as number)} km/h
            </span>
          )}
          {entity.attributes.humidity !== undefined && (
            <span className={styles.weatherStat}>
              <Droplets size={11} /> {Math.round(entity.attributes.humidity)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
