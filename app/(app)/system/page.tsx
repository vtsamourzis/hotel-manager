import { auth } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import {
  getHAConnection,
  getCurrentEntitySnapshot,
  getConnectionStatus,
} from "@/lib/ha/connection";
import { getConfig } from "home-assistant-js-websocket";
import {
  getMachineId,
  getNetworkInfo,
  getAppVersion,
} from "@/lib/system-info";
import styles from "./system.module.css";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  const session = await auth();

  // HA health data — wrap in try/catch so page renders even if HA is down
  let haConnected = false;
  let haVersion = "\u2014";
  let entityCount = 0;
  let unavailableCount = 0;

  try {
    const status = getConnectionStatus();
    haConnected = status === "connected";

    if (haConnected) {
      const conn = await getHAConnection();
      const config = await getConfig(conn);
      haVersion = config.version;
    }

    const snapshot = getCurrentEntitySnapshot();
    const entities = Object.values(snapshot);
    entityCount = entities.length;
    unavailableCount = entities.filter((e) => e.state === "unavailable").length;
  } catch {
    haConnected = false;
    haVersion = "\u2014";
  }

  // System info
  const machineId = getMachineId();
  const networkInfo = getNetworkInfo();
  const appVersion = getAppVersion();

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>
        {"\u03A3\u03CD\u03C3\u03C4\u03B7\u03BC\u03B1"}
      </h1>

      <div className={styles.cardStack}>
        {/* Card 1: HA Health */}
        <div className="hcard">
          <div className="hcard-header">
            <span className="hcard-title">
              {"\u039A\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7 HA"}
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.statusLine}>
              <span
                className={`${styles.statusDot} ${
                  haConnected
                    ? styles.statusDotConnected
                    : styles.statusDotDisconnected
                }`}
              />
              <span className={styles.statusText}>
                {haConnected
                  ? `\u03A3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF \u2014 v${haVersion}`
                  : "\u0391\u03C0\u03BF\u03C3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Device Summary */}
        <div className="hcard">
          <div className="hcard-header">
            <span className="hcard-title">
              {"\u03A3\u03C5\u03C3\u03BA\u03B5\u03C5\u03AD\u03C2"}
            </span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.summaryLine}>
              {"\u03A3\u03C5\u03C3\u03BA\u03B5\u03C5\u03AD\u03C2"}: {entityCount},{" "}
              {"\u0395\u03BA\u03C4\u03CC\u03C2"}: {unavailableCount}
            </p>
          </div>
        </div>

        {/* Card 3: Subscription */}
        <div className="hcard">
          <div className="hcard-header">
            <span className="hcard-title">
              {"\u03A3\u03C5\u03BD\u03B4\u03C1\u03BF\u03BC\u03AE"}
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.subscriptionCard}>
              <div className={styles.planRow}>
                <span className={styles.planName}>AegeanSea Professional</span>
                <span className={styles.statusBadge}>
                  {"\u0395\u03BD\u03B5\u03C1\u03B3\u03AE"}
                </span>
              </div>
              <div className={styles.infoGrid}>
                <span className={styles.infoLabel}>
                  {"\u0391\u03BD\u03B1\u03BD\u03AD\u03C9\u03C3\u03B7"}
                </span>
                <span className={styles.infoValue}>01/01/2027</span>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>
                  {session?.user?.email ?? "\u2014"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Installation Info */}
        <div className="hcard">
          <div className="hcard-header">
            <span className="hcard-title">
              {"\u03A0\u03BB\u03B7\u03C1\u03BF\u03C6\u03BF\u03C1\u03AF\u03B5\u03C2 \u0395\u03B3\u03BA\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7\u03C2"}
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.infoGrid}>
              <span className={styles.infoLabel}>Machine ID</span>
              <span className={`${styles.infoValue} ${styles.machineId}`}>
                {machineId}
              </span>
              <span className={styles.infoLabel}>MAC</span>
              <span className={styles.infoValue}>{networkInfo.mac}</span>
              <span className={styles.infoLabel}>IP</span>
              <span className={styles.infoValue}>{networkInfo.ip}</span>
              <span className={styles.infoLabel}>Service email</span>
              <span className={styles.infoValue}>support@aegeansea.gr</span>
              <span className={styles.infoLabel}>App version</span>
              <span className={styles.infoValue}>
                AegeanSea v{appVersion}
              </span>
              <span className={styles.infoLabel}>HA version</span>
              <span className={styles.infoValue}>{haVersion}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Account */}
        <div className="hcard">
          <div className="hcard-header">
            <span className="hcard-title">
              {"\u039B\u03BF\u03B3\u03B1\u03C1\u03B9\u03B1\u03C3\u03BC\u03CC\u03C2"}
            </span>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.accountLine}>
              <strong>
                {"\u038C\u03BD\u03BF\u03BC\u03B1"}:
              </strong>{" "}
              {session?.user?.name ?? "\u2014"}
            </p>
            <p className={styles.accountLine}>
              <strong>Email:</strong> {session?.user?.email ?? "\u2014"}
            </p>
            <div className={styles.logoutWrap}>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
