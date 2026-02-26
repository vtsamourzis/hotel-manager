"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { logoutAction } from "./actions"

export function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logoutAction()
      router.replace("/login") // client-side — PWA stays in standalone mode
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="btn-secondary"
      style={{ color: "var(--clay-text)", borderColor: "var(--clay-border)" }}
    >
      {isPending ? "Αποσύνδεση..." : "Αποσύνδεση"}
    </button>
  )
}
