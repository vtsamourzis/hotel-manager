"use client"
import { useState, useTransition } from "react"
import { setupAction } from "./actions"

export default function SetupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await setupAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--canvas, hsl(33, 18%, 91%))",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{
            fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px",
            color: "var(--ink-1, #1a1a1a)", lineHeight: 1.2,
            marginBottom: "6px",
          }}>
            Αρχική Εγκατάσταση
          </h1>
          <p style={{ fontSize: "13px", color: "var(--ink-3, #777777)" }}>
            Δημιουργία λογαριασμού διαχειριστή
          </p>
        </div>

        {/* Setup card */}
        <div style={{
          background: "var(--surface-2, #ffffff)",
          border: "1px solid var(--border-2, #d4c9b8)",
          borderRadius: "var(--r-lg, 10px)",
          padding: "28px 24px",
        }}>
          <form action={handleSubmit}>
            {/* Name field */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: 600,
                color: "var(--ink-2, #444444)", marginBottom: "6px",
              }}>
                Ονοματεπώνυμο
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="π.χ. Γιώργης Παπαδόπουλος"
                style={{
                  width: "100%", padding: "9px 11px",
                  border: "1px solid var(--border-2, #d4c9b8)",
                  borderRadius: "var(--r-sm, 6px)",
                  background: "var(--surface-1, #f5efe6)",
                  color: "var(--ink-1, #1a1a1a)",
                  fontSize: "14px", fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            {/* Email field */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: 600,
                color: "var(--ink-2, #444444)", marginBottom: "6px",
              }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                style={{
                  width: "100%", padding: "9px 11px",
                  border: "1px solid var(--border-2, #d4c9b8)",
                  borderRadius: "var(--r-sm, 6px)",
                  background: "var(--surface-1, #f5efe6)",
                  color: "var(--ink-1, #1a1a1a)",
                  fontSize: "14px", fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: error ? "10px" : "20px" }}>
              <label style={{
                display: "block", fontSize: "12px", fontWeight: 600,
                color: "var(--ink-2, #444444)", marginBottom: "6px",
              }}>
                Κωδικός
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Τουλάχιστον 8 χαρακτήρες"
                style={{
                  width: "100%", padding: "9px 11px",
                  border: `1px solid ${error ? "var(--clay-border, #d97706)" : "var(--border-2, #d4c9b8)"}`,
                  borderRadius: "var(--r-sm, 6px)",
                  background: "var(--surface-1, #f5efe6)",
                  color: "var(--ink-1, #1a1a1a)",
                  fontSize: "14px", fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            {/* Inline error */}
            {error && (
              <p style={{
                fontSize: "12.5px", color: "var(--clay-text, #92400e)",
                background: "var(--clay-surface, #fef3c7)",
                border: "1px solid var(--clay-border, #d97706)",
                borderRadius: "var(--r-sm, 6px)", padding: "7px 10px",
                marginBottom: "16px",
              }}>
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isPending}
              style={{
                width: "100%", padding: "10px",
                background: isPending ? "var(--aegean-hover, hsl(198,60%,32%))" : "var(--aegean, hsl(198,72%,24%))",
                color: "white", border: "none",
                borderRadius: "var(--r-sm, 6px)", fontSize: "14px",
                fontWeight: 600, fontFamily: "inherit",
                cursor: isPending ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px",
                opacity: isPending ? 0.85 : 1,
              }}
            >
              {isPending ? (
                <>
                  <span style={{
                    width: "14px", height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Δημιουργία...
                </>
              ) : "Δημιουργία Λογαριασμού"}
            </button>
          </form>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input:focus { border-color: var(--aegean-border, hsl(198,72%,50%)) !important; box-shadow: 0 0 0 3px var(--aegean-surface, hsl(198,72%,90%)); }
        `}</style>
      </div>
    </div>
  )
}
