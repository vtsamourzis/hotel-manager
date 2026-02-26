"use client";

import { useState, useCallback, type FormEvent } from "react";
import { CheckCircle } from "lucide-react";
import { ROOMS } from "@/lib/ha/entity-map";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import styles from "./automations.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = "low" | "normal" | "high";

interface NewAutomationPanelProps {
  open: boolean;
  onClose: () => void;
}

type PanelState = "form" | "submitting" | "confirmed";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "\u03A7\u03B1\u03BC\u03B7\u03BB\u03AE" },
  { value: "normal", label: "\u039A\u03B1\u03BD\u03BF\u03BD\u03B9\u03BA\u03AE" },
  { value: "high", label: "\u03A5\u03C8\u03B7\u03BB\u03AE" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewAutomationPanel({ open, onClose }: NewAutomationPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [room, setRoom] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");

  // Inline validation errors
  const [titleError, setTitleError] = useState("");
  const [descError, setDescError] = useState("");

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setRoom("");
    setPriority("normal");
    setTitleError("");
    setDescError("");
    setPanelState("form");
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    // Reset form after panel slide-out animation completes
    setTimeout(resetForm, 350);
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Offline guard
      const serverOnline = useUIStore.getState().serverOnline;
      if (guardOffline(serverOnline)) return;

      // Validate
      let valid = true;

      if (!title.trim()) {
        setTitleError("\u03A4\u03BF \u03C0\u03B5\u03B4\u03AF\u03BF \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C5\u03C0\u03BF\u03C7\u03C1\u03B5\u03C9\u03C4\u03B9\u03BA\u03CC");
        valid = false;
      } else {
        setTitleError("");
      }

      if (!description.trim()) {
        setDescError("\u03A4\u03BF \u03C0\u03B5\u03B4\u03AF\u03BF \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C5\u03C0\u03BF\u03C7\u03C1\u03B5\u03C9\u03C4\u03B9\u03BA\u03CC");
        valid = false;
      } else {
        setDescError("");
      }

      if (!valid) return;

      // Compose description with all form fields
      const parts = [`[${title.trim()}]`, description.trim()];
      if (room) parts.push(`Δωμάτιο: ${room}`);
      parts.push(`Προτεραιότητα: ${priority}`);
      const fullDescription = parts.join("\n");

      setPanelState("submitting");

      try {
        const res = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "automation",
            description: fullDescription,
          }),
        });

        if (!res.ok) throw new Error("Submit failed");

        setPanelState("confirmed");
      } catch {
        setPanelState("form");
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              message: "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1 \u03BA\u03B1\u03C4\u03AC \u03C4\u03B7\u03BD \u03C5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE",
              type: "error",
            },
          }),
        );
      }
    },
    [title, description, room, priority]
  );

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`${styles.overlay} ${open ? styles.overlayVisible : ""}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        {/* Drag handle (mobile) */}
        <div className={styles.dragHandle} />

        {/* Header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            {"\u039D\u03AD\u03BF\u03C2 \u0391\u03C5\u03C4\u03BF\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2"}
          </h2>
          <button className={styles.panelCloseBtn} onClick={handleClose}>
            &times;
          </button>
        </div>

        {/* Content */}
        <div className={styles.panelContent}>
          {panelState === "submitting" && (
            <div className={styles.spinner}>
              <div className={styles.spinnerDot} />
            </div>
          )}

          {panelState === "confirmed" && (
            <div className={styles.confirmation}>
              <div className={styles.confirmIcon}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.confirmTitle}>
                {"\u03A4\u03BF \u03B1\u03AF\u03C4\u03B7\u03BC\u03AC \u03C3\u03B1\u03C2 \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03B8\u03B7\u03BA\u03B5!"}
              </div>
              <div className={styles.confirmSub}>
                {"\u0398\u03B1 \u03B5\u03BD\u03B7\u03BC\u03B5\u03C1\u03C9\u03B8\u03B5\u03AF\u03C4\u03B5 \u03CC\u03C4\u03B1\u03BD \u03BF \u03B1\u03C5\u03C4\u03BF\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2 \u03B4\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03B7\u03B8\u03B5\u03AF."}
              </div>
              <button className={styles.submitBtn} onClick={handleClose}>
                {"\u039A\u03BB\u03B5\u03AF\u03C3\u03B9\u03BC\u03BF"}
              </button>
            </div>
          )}

          {panelState === "form" && (
            <form onSubmit={handleSubmit} noValidate>
              {/* Title */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {"\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2"} *
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError("");
                  }}
                  placeholder={"\u03C0.\u03C7. \u0391\u03C5\u03C4\u03CC\u03BC\u03B1\u03C4\u03BF \u03BA\u03BB\u03B5\u03AF\u03C3\u03B9\u03BC\u03BF AC \u03C3\u03C4\u03BF check-out"}
                />
                {titleError && (
                  <div className={styles.formError}>{titleError}</div>
                )}
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {"\u03A0\u03B5\u03C1\u03B9\u03B3\u03C1\u03B1\u03C6\u03AE"} *
                </label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (descError) setDescError("");
                  }}
                  placeholder={"\u03A0\u03B5\u03C1\u03B9\u03B3\u03C1\u03AC\u03C8\u03C4\u03B5 \u03C4\u03B9 \u03B8\u03AD\u03BB\u03B5\u03C4\u03B5 \u03BD\u03B1 \u03BA\u03AC\u03BD\u03B5\u03B9 \u03BF \u03B1\u03C5\u03C4\u03BF\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2..."}
                />
                {descError && (
                  <div className={styles.formError}>{descError}</div>
                )}
              </div>

              {/* Room (optional) */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {"\u0394\u03C9\u03BC\u03AC\u03C4\u03B9\u03BF"}
                </label>
                <select
                  className={styles.formSelect}
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                >
                  <option value="">
                    {"\u038C\u03BB\u03B1 \u03C4\u03B1 \u03B4\u03C9\u03BC\u03AC\u03C4\u03B9\u03B1"}
                  </option>
                  {ROOMS.map((r) => (
                    <option key={r} value={r}>
                      {"\u0394\u03C9\u03BC\u03AC\u03C4\u03B9\u03BF"} {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {"\u03A0\u03C1\u03BF\u03C4\u03B5\u03C1\u03B1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1"}
                </label>
                <div className={styles.priorityGroup}>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.priorityBtn} ${priority === opt.value ? styles.priorityBtnActive : ""}`}
                      onClick={() => setPriority(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className={styles.submitBtn}>
                {"\u03A5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE \u0391\u03B9\u03C4\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2"}
              </button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
