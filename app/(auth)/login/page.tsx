"use client"
import { useState, useTransition } from "react"
import { loginAction } from "./actions"
import styles from "@/components/auth/login.module.css"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div style={{ width: "100%", maxWidth: "380px" }}>
      {/* Property name header */}
      <p className={styles.propertyName}>
        {process.env.NEXT_PUBLIC_PROPERTY_NAME ?? "Hotel Manager"}
      </p>

      {/* Login card */}
      <div className={styles.loginCard}>
        <form action={handleSubmit}>
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
              autoComplete="current-password"
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
                Σύνδεση...
              </>
            ) : "Είσοδος"}
          </button>
        </form>
      </div>

      {/* Powered by footer */}
      <p className={styles.poweredBy}>
        Powered by AegeanSea Platform
      </p>
    </div>
  )
}
