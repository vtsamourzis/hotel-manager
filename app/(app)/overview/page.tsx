import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function OverviewPage() {
  const session = await auth()
  if (!session) redirect("/login")
  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--ink-1, #1a1a1a)" }}>
        Αρχική
      </h1>
      <p style={{ color: "var(--ink-3, #777777)", marginTop: "8px" }}>
        Συνδεδεμένος ως: {session.user?.name} ({session.user?.email})
      </p>
    </div>
  )
}
