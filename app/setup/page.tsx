"use client"
import { useState, useTransition } from "react"
import { setupAction } from "./actions"
import styles from "@/components/auth/login.module.css"

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
      background: "var(--canvas)",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Header */}
        <p className={styles.pageTitle}>
          Αρχική Εγκατάσταση
        </p>
        <p className={styles.pageSubtitle}>
          Δημιουργία λογαριασμού διαχειριστή
        </p>

        {/* Setup card */}
        <div className={styles.loginCard} style={{ maxWidth: "400px" }}>
          <form action={handleSubmit}>
            {/* Name field */}
            <div style={{ marginBottom: "14px" }}>
              <label className={styles.fieldLabel}>
                Ονοματεπώνυμο
              </label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="π.χ. Γιώργης Παπαδόπουλος"
                className={styles.fieldInput}
              />
            </div>

            {/* Email field */}
            <div style={{ marginBottom: "14px" }}>
              <label className={styles.fieldLabel}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className={styles.fieldInput}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: error ? "10px" : "20px" }}>
              <label className={styles.fieldLabel}>
                Κωδικός
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Τουλάχιστον 8 χαρακτήρες"
                className={`${styles.fieldInput} ${error ? styles.fieldInputError : ""}`}
              />
            </div>

            {/* Inline error */}
            {error && (
              <p className={styles.errorMessage}>
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isPending}
              className={styles.submitBtn}
            >
              {isPending ? (
                <>
                  <span className={styles.spinner} />
                  Δημιουργία...
                </>
              ) : "Δημιουργία Λογαριασμού"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
