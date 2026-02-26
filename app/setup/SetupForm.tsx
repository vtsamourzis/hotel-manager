"use client"
import { useState, useTransition } from "react"
import { setupAction } from "./actions"
import styles from "@/components/auth/login.module.css"

export function SetupForm() {
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
        <p className={styles.pageTitle}>Αρχική Εγκατάσταση</p>
        <p className={styles.pageSubtitle}>Δημιουργία λογαριασμού διαχειριστή</p>

        <div className={styles.loginCard}>
          <form action={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label className={styles.fieldLabel}>Ονοματεπώνυμο</label>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="π.χ. Γιώργης Παπαδόπουλος"
                className={styles.fieldInput}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className={styles.fieldInput}
              />
            </div>

            <div style={{ marginBottom: error ? "10px" : "20px" }}>
              <label className={styles.fieldLabel}>Κωδικός</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Τουλάχιστον 8 χαρακτήρες"
                className={`${styles.fieldInput} ${error ? styles.fieldInputError : ""}`}
              />
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <button type="submit" disabled={isPending} className={styles.submitBtn}>
              {isPending ? (
                <><span className={styles.spinner} />Δημιουργία...</>
              ) : "Δημιουργία Λογαριασμού"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
