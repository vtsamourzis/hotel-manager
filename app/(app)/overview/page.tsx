import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function OverviewPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const now = new Date()
  const dateStr = now.toLocaleDateString("el-GR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div style={{ padding: "26px 24px 48px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontSize: "26px", fontWeight: 700,
          letterSpacing: "-0.8px", color: "var(--ink-1)", lineHeight: 1.1,
        }}>
          Καλημέρα, {session.user?.name?.split(" ")[0] ?? "Manager"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--ink-3)", marginTop: "3px" }}>
          {dateStr}
        </p>
      </div>

      <div className="hcard" style={{ maxWidth: "480px" }}>
        <div className="hcard-header">
          <span className="hcard-title">Πρόβλεψη — Phase 2</span>
        </div>
        <div style={{ padding: "16px", color: "var(--ink-3)", fontSize: "13px" }}>
          Το live dashboard είναι διαθέσιμο στην Phase 2. Προς το παρόν, η σύνδεση επιβεβαιώθηκε.
        </div>
      </div>
    </div>
  )
}
