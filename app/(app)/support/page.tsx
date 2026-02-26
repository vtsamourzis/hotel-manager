"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Bug, MessageSquare, Clock } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";
import { guardOffline } from "@/lib/hooks/useServerOnline";
import type { SupportTicket } from "@/lib/db/support";
import styles from "./support.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = "form" | "submitting" | "confirmed";

const STATUS_LABELS: Record<SupportTicket["status"], string> = {
  open: "\u0391\u03BD\u03BF\u03B9\u03C7\u03C4\u03CC",
  in_progress: "\u03A3\u03B5 \u03B5\u03BE\u03AD\u03BB\u03B9\u03BE\u03B7",
  closed: "\u039A\u03BB\u03B5\u03B9\u03C3\u03C4\u03CC",
};

const STATUS_CLASSES: Record<SupportTicket["status"], string> = {
  open: styles.statusOpen,
  in_progress: styles.statusInProgress,
  closed: styles.statusClosed,
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return iso;
  }
}

function truncate(text: string, max = 100): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\u2026";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SupportPage() {
  const [formState, setFormState] = useState<FormState>("form");
  const [ticketType, setTicketType] = useState<"bug" | "general">("bug");
  const [description, setDescription] = useState("");
  const [descError, setDescError] = useState("");
  const [lastTicketId, setLastTicketId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // History query
  const { data: ticketsData } = useQuery<{ tickets: SupportTicket[] }>({
    queryKey: ["support-tickets"],
    queryFn: () => fetch("/api/support").then((r) => r.json()),
  });

  const tickets = ticketsData?.tickets ?? [];

  const resetForm = useCallback(() => {
    setTicketType("bug");
    setDescription("");
    setDescError("");
    setLastTicketId(null);
    setFormState("form");
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Offline guard
      const serverOnline = useUIStore.getState().serverOnline;
      if (guardOffline(serverOnline)) return;

      // Validate
      if (!description.trim()) {
        setDescError("\u0397 \u03C0\u03B5\u03C1\u03B9\u03B3\u03C1\u03B1\u03C6\u03AE \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C5\u03C0\u03BF\u03C7\u03C1\u03B5\u03C9\u03C4\u03B9\u03BA\u03AE");
        return;
      }

      setFormState("submitting");

      try {
        const res = await fetch("/api/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: ticketType,
            description: description.trim(),
          }),
        });

        if (!res.ok) {
          throw new Error("Submit failed");
        }

        const data = (await res.json()) as { ticket: SupportTicket };
        setLastTicketId(data.ticket.id);
        setFormState("confirmed");
        queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      } catch {
        setFormState("form");
        window.dispatchEvent(
          new CustomEvent("toast", {
            detail: {
              message:
                "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1 \u03BA\u03B1\u03C4\u03AC \u03C4\u03B7\u03BD \u03C5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE",
              type: "error",
            },
          }),
        );
      }
    },
    [description, ticketType, queryClient],
  );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>
        {"\u03A5\u03C0\u03BF\u03C3\u03C4\u03AE\u03C1\u03B9\u03BE\u03B7"}
      </h1>

      {/* Form card */}
      <div className={styles.formCard}>
        {formState === "submitting" && (
          <div className={styles.spinner}>
            <div className={styles.spinnerDot} />
          </div>
        )}

        {formState === "confirmed" && (
          <div className={styles.confirmation}>
            <div className={styles.confirmIcon}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.confirmTitle}>
              {"\u0397 \u03B1\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC \u03C3\u03B1\u03C2 \u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03B8\u03B7\u03BA\u03B5!"}
            </div>
            <div className={styles.confirmTicketId}>
              {"\u0391\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2"}: #{lastTicketId}
            </div>
            <button className={styles.resetBtn} onClick={resetForm}>
              {"\u039D\u03AD\u03B1 \u03B1\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC"}
            </button>
          </div>
        )}

        {formState === "form" && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Type selector */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {"\u03A4\u03CD\u03C0\u03BF\u03C2"}
              </label>
              <select
                className={styles.formSelect}
                value={ticketType}
                onChange={(e) =>
                  setTicketType(e.target.value as "bug" | "general")
                }
              >
                <option value="bug">
                  {"\u0391\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC \u03C3\u03C6\u03AC\u03BB\u03BC\u03B1\u03C4\u03BF\u03C2"}
                </option>
                <option value="general">
                  {"\u0393\u03B5\u03BD\u03B9\u03BA\u03CC \u03BC\u03AE\u03BD\u03C5\u03BC\u03B1"}
                </option>
              </select>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {"\u03A0\u03B5\u03C1\u03B9\u03B3\u03C1\u03B1\u03C6\u03AE"}
              </label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descError) setDescError("");
                }}
                placeholder={"\u03A0\u03B5\u03C1\u03B9\u03B3\u03C1\u03AC\u03C8\u03C4\u03B5 \u03C4\u03BF \u03C0\u03C1\u03CC\u03B2\u03BB\u03B7\u03BC\u03B1 \u03AE \u03C4\u03BF \u03BC\u03AE\u03BD\u03C5\u03BC\u03AC \u03C3\u03B1\u03C2..."}
              />
              {descError && (
                <div className={styles.formError}>{descError}</div>
              )}
            </div>

            {/* Submit button */}
            <button type="submit" className={styles.submitBtn}>
              {"\u03A5\u03C0\u03BF\u03B2\u03BF\u03BB\u03AE"}
            </button>
          </form>
        )}
      </div>

      {/* History section */}
      <div className={styles.historySection}>
        <h2 className={styles.historyTitle}>
          {"\u0399\u03C3\u03C4\u03BF\u03C1\u03B9\u03BA\u03CC \u0391\u03BD\u03B1\u03C6\u03BF\u03C1\u03CE\u03BD"}
        </h2>

        {tickets.length === 0 ? (
          <div className={styles.emptyState}>
            {"\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B1\u03BD\u03B1\u03C6\u03BF\u03C1\u03AD\u03C2"}
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className={styles.ticketCard}>
              <div className={styles.ticketHeader}>
                <span className={styles.ticketNumber}>#{ticket.id}</span>
                <span className={styles.ticketType}>
                  {ticket.type === "bug"
                    ? "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1"
                    : ticket.type === "automation"
                      ? "\u0391\u03C5\u03C4\u03BF\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2"
                      : "\u039C\u03AE\u03BD\u03C5\u03BC\u03B1"}
                </span>
                <span
                  className={`${styles.statusBadge} ${STATUS_CLASSES[ticket.status]}`}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <div className={styles.ticketDescription}>
                {truncate(ticket.description)}
              </div>
              <div className={styles.ticketTimestamp}>
                <Clock size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
                {formatTimestamp(ticket.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
