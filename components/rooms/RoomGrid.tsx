"use client";

import { useRoomStore } from "@/lib/store/room-store";
import { useUIStore } from "@/lib/store/ui-store";
import { ROOMS, FLOOR_ROOMS } from "@/lib/ha/entity-map";
import type { RoomId } from "@/lib/ha/entity-map";
import { RoomCard } from "./RoomCard";
import { RoomDetailPanel } from "./RoomDetailPanel";
import styles from "./rooms.module.css";

type Floor = "all" | "1" | "2" | "3";
type Filter = "all" | "occupied" | "vacant" | "cleaning" | "preparing";

const FLOOR_TABS: { value: Floor; label: string }[] = [
  { value: "all", label: "Όλα" },
  { value: "1", label: "1ος" },
  { value: "2", label: "2ος" },
  { value: "3", label: "3ος" },
];

const FILTER_CHIPS: { value: Filter; label: string }[] = [
  { value: "all", label: "Όλα" },
  { value: "occupied", label: "Κατειλημμένα" },
  { value: "vacant", label: "Ελεύθερα" },
  { value: "cleaning", label: "Καθαρισμός" },
  { value: "preparing", label: "Προετοιμασία" },
];

const STATUS_FILTER_MAP: Record<Filter, string | null> = {
  all: null,
  occupied: "Occupied",
  vacant: "Vacant",
  cleaning: "Cleaning",
  preparing: "Preparing",
};

export function RoomGrid() {
  const rooms = useRoomStore((state) => state.rooms);
  const { activeFloor, activeFilter, setFloor, setFilter, selectRoom, selectedRoomId, openCheckinModal } = useUIStore();

  // ── Apply floor filter ───────────────────────────────────────────────────
  const floorRooms: RoomId[] =
    activeFloor === "all"
      ? [...ROOMS]
      : FLOOR_ROOMS[activeFloor as "1" | "2" | "3"];

  // ── Apply status filter ──────────────────────────────────────────────────
  const statusFilter = STATUS_FILTER_MAP[activeFilter];
  const filteredRooms = floorRooms.filter((id) => {
    if (!statusFilter) return true;
    return rooms[id]?.status === statusFilter;
  });

  // ── Status summary counts (always across all rooms, not filtered) ────────
  const allRoomList = [...ROOMS];
  const occupied  = allRoomList.filter((id) => rooms[id]?.status === "Occupied").length;
  const vacant    = allRoomList.filter((id) => rooms[id]?.status === "Vacant").length;
  const cleaning  = allRoomList.filter((id) => rooms[id]?.status === "Cleaning").length;
  const preparing = allRoomList.filter((id) => rooms[id]?.status === "Preparing").length;

  return (
    <div className={styles.panelLayout}>
      {/* ── Grid area ───────────────────────────────────────────────────── */}
      <div className={styles.gridArea}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Δωμάτια</h1>
          <button
            className="btn-primary"
            onClick={openCheckinModal}
            aria-label="Νέα άφιξη"
          >
            + Νέα Άφιξη
          </button>
        </div>

        {/* Floor tabs */}
        <div className={styles.floorTabs} role="tablist" aria-label="Όροφοι">
          {FLOOR_TABS.map(({ value, label }) => (
            <button
              key={value}
              role="tab"
              aria-selected={activeFloor === value}
              className={`${styles.floorTab} ${activeFloor === value ? styles.floorTabActive : ""}`}
              onClick={() => setFloor(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter chips */}
        <div className={styles.filterChips} role="group" aria-label="Φίλτρο κατάστασης">
          {FILTER_CHIPS.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.filterChip} ${activeFilter === value ? styles.filterChipActive : ""}`}
              onClick={() => setFilter(value)}
              aria-pressed={activeFilter === value}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status summary */}
        <div className={styles.statusSummary}>
          <span className={styles.summaryItem}>
            <span className={`${styles.summaryDot} ${styles.summaryDotOccupied}`} />
            {occupied} Κατειλημμένα
          </span>
          <span className={styles.summaryItem}>
            <span className={`${styles.summaryDot} ${styles.summaryDotVacant}`} />
            {vacant} Ελεύθερα
          </span>
          {cleaning > 0 && (
            <span className={styles.summaryItem}>
              <span className={`${styles.summaryDot} ${styles.summaryDotCleaning}`} />
              {cleaning} σε Καθαρισμό
            </span>
          )}
          {preparing > 0 && (
            <span className={styles.summaryItem}>
              <span className={`${styles.summaryDot} ${styles.summaryDotPreparing}`} />
              {preparing} σε Προετοιμασία
            </span>
          )}
        </div>

        {/* Room grid */}
        <div className={styles.roomGrid}>
          {filteredRooms.map((roomId) => (
            <RoomCard
              key={roomId}
              roomId={roomId}
              isSelected={selectedRoomId === roomId}
              onClick={() => selectRoom(roomId)}
            />
          ))}
          {filteredRooms.length === 0 && (
            <p style={{ color: "var(--ink-3)", fontSize: "13px", gridColumn: "1/-1" }}>
              Δεν υπάρχουν δωμάτια με αυτό το φίλτρο.
            </p>
          )}
        </div>
      </div>

      {/* ── Detail panel (always in DOM) ────────────────────────────────── */}
      <RoomDetailPanel />
    </div>
  );
}
