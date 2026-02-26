"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { StatusButtons } from "./panels/StatusButtons";
import { GuestInfo } from "./panels/GuestInfo";
import { ACPanel } from "./panels/ACPanel";
import { LightsPanel } from "./panels/LightsPanel";
import { LockControl } from "./panels/LockControl";
import { BoilerPanel } from "./panels/BoilerPanel";
import { WindowToggle } from "./panels/WindowToggle";
import { CheckInModal } from "./CheckInModal";
import styles from "./rooms.module.css";

const STATUS_BADGE_CLASS: Record<string, string> = {
  Occupied:  styles.statusBadgeOccupied,
  Vacant:    styles.statusBadgeVacant,
  Cleaning:  styles.statusBadgeCleaning,
  Preparing: styles.statusBadgePreparing,
};

const STATUS_LABEL: Record<string, string> = {
  Occupied:  "Κατειλημμένο",
  Vacant:    "Ελεύθερο",
  Cleaning:  "Καθαρισμός",
  Preparing: "Προετοιμασία",
};

// Stable QueryClient for the panel — hoisted outside component to avoid recreation
const panelQueryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function PanelContent() {
  const rooms = useRoomStore((s) => s.rooms);
  const { selectedRoomId, isPanelOpen, closePanel, openCheckinModal } = useUIStore();

  const room = selectedRoomId ? rooms[selectedRoomId] : null;
  const status = room?.status ?? "Vacant";
  const badgeClass = STATUS_BADGE_CLASS[status] ?? styles.statusBadgeVacant;
  const badgeLabel = STATUS_LABEL[status] ?? status;

  return (
    <>
      {/* Backdrop — closes panel when clicked on mobile */}
      <div
        className={`${styles.backdrop} ${isPanelOpen ? styles.backdropVisible : ""}`}
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Panel — always in DOM; CSS translateX controls visibility */}
      <aside
        className={`${styles.detailPanel} ${isPanelOpen ? styles.detailPanelOpen : ""}`}
        aria-label={
          selectedRoomId
            ? `Λεπτομέρειες δωματίου ${selectedRoomId}`
            : "Λεπτομέρειες δωματίου"
        }
        aria-hidden={!isPanelOpen}
      >
        {/* Panel header */}
        <div className={styles.panelHeader}>
          {selectedRoomId && (
            <span className={styles.panelRoomNumber}>{selectedRoomId}</span>
          )}
          {selectedRoomId && (
            <span className={`${styles.statusBadge} ${badgeClass}`}>{badgeLabel}</span>
          )}
          {selectedRoomId && status !== "Occupied" && (
            <button
              className={styles.checkinBtn}
              onClick={openCheckinModal}
            >
              + Check-in
            </button>
          )}
          <button
            className={styles.panelCloseBtn}
            onClick={closePanel}
            aria-label="Κλείσιμο"
          >
            ×
          </button>
        </div>

        {/* Sub-panels — shown only when a room is selected */}
        {selectedRoomId && room ? (
          <div className={styles.panelContent}>
            {/* 0. Alerts — smoke, leak, window, door */}
            {(room.smokeAlert?.state === "on" ||
              room.leakAlert?.state === "on" ||
              room.windowOpen?.state === "on" ||
              room.lock?.state === "unlocked") && (
              <div className={styles.panelSection}>
                <div className={styles.panelSectionTitle}>Ειδοποιήσεις</div>
                <div className={styles.alertList}>
                  {room.smokeAlert?.state === "on" && (
                    <div className={`${styles.alertRow} ${styles.alertDanger}`}>
                      <span className={styles.alertDot} />
                      <span>Ανιχνεύθηκε καπνός</span>
                    </div>
                  )}
                  {room.leakAlert?.state === "on" && (
                    <div className={`${styles.alertRow} ${styles.alertDanger}`}>
                      <span className={styles.alertDot} />
                      <span>Ανιχνεύθηκε διαρροή</span>
                    </div>
                  )}
                  {room.windowOpen?.state === "on" && (
                    <div className={`${styles.alertRow} ${styles.alertWarning}`}>
                      <span className={styles.alertDotWarning} />
                      <span>Παράθυρο ανοιχτό</span>
                    </div>
                  )}
                  {room.lock?.state === "unlocked" && (
                    <div className={`${styles.alertRow} ${styles.alertWarning}`}>
                      <span className={styles.alertDotWarning} />
                      <span>Πόρτα ξεκλείδωτη</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 1. Status buttons */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>Κατάσταση</div>
              <StatusButtons roomId={selectedRoomId} currentStatus={status} />
            </div>

            {/* 2. Guest info (Occupied only) */}
            {status === "Occupied" && (
              <div className={styles.panelSection}>
                <div className={styles.panelSectionTitle}>Επισκέπτης</div>
                <GuestInfo roomId={selectedRoomId} currentStatus={status} />
              </div>
            )}

            {/* 3. AC panel */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>Κλιματισμός</div>
              <ACPanel roomId={selectedRoomId} acState={room.acState} />
            </div>

            {/* 3b. Window toggle (demo: triggers AC shutoff automation) */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>Παράθυρο</div>
              <WindowToggle roomId={selectedRoomId} windowState={room.windowOpen} />
            </div>

            {/* 4. Lights panel */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>Φωτισμός</div>
              <LightsPanel roomId={selectedRoomId} lights={room.lights} />
            </div>

            {/* 5. Lock control */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>Κλειδαριά</div>
              <LockControl roomId={selectedRoomId} lockState={room.lock} />
            </div>

            {/* 6. Boiler panel */}
            <div className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>Θερμοσίφωνας</div>
              <BoilerPanel
                boilerSource={room.boilerSource}
              />
            </div>

            {/* Room temperature */}
            {room.temperature && (
              <div className={styles.panelSection}>
                <div className={styles.panelSectionTitle}>Θερμοκρασία</div>
                <div className={styles.humidityRow}>
                  <span className={styles.humidityValue}>
                    {Number(room.temperature.state).toFixed(1)}°C
                  </span>
                  <span className={styles.humidityLabel}>θερμοκρασία δωματίου</span>
                </div>
              </div>
            )}

            {/* Humidity — read-only from input_number entity */}
            {room.humidity && (
              <div className={styles.panelSection}>
                <div className={styles.panelSectionTitle}>Υγρασία</div>
                <div className={styles.humidityRow}>
                  <span className={styles.humidityValue}>
                    {Number(room.humidity.state).toFixed(0)}%
                  </span>
                  <span className={styles.humidityLabel}>σχετική υγρασία</span>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-4)",
              fontSize: "13px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            Επιλέξτε ένα δωμάτιο
          </div>
        )}
      </aside>

      {/* Check-in modal */}
      <CheckInModal />
    </>
  );
}

export function RoomDetailPanel() {
  return (
    <QueryClientProvider client={panelQueryClient}>
      <PanelContent />
    </QueryClientProvider>
  );
}
