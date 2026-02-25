"use client";
import { useServerOnline } from "@/lib/hooks/useServerOnline";
import { WifiOff } from "lucide-react";
import styles from "./nav/nav.module.css";

export function CacheIndicator() {
  const serverOnline = useServerOnline();
  if (serverOnline) return null;

  return (
    <div className={styles.cacheIndicator}>
      <WifiOff size={12} />
      {"Από cache"}
    </div>
  );
}
