"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "./actions"
import styles from "@/components/auth/login.module.css"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.replace("/overview") // client-side — PWA stays in standalone mode
      }
    })
  }

  return (
    <div style={{ width: "100%", maxWidth: "380px" }}>
      <p className={styles.propertyName}>
        {process.env.NEXT_PUBLIC_PROPERTY_NAME ?? "Hotel Manager"}
      </p>

      <div className={styles.loginCard}>
        <form action={handleSubmit}>
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
              autoComplete="current-password"
              className={`${styles.fieldInput} ${error ? styles.fieldInputError : ""}`}
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" disabled={isPending} className={styles.submitBtn}>
            {isPending ? (
              <><span className={styles.spinner} />Σύνδεση...</>
            ) : "Είσοδος"}
          </button>
        </form>
      </div>

      <p className={styles.poweredBy}>Powered by AegeanSea Platform</p>
    </div>
  )
}
