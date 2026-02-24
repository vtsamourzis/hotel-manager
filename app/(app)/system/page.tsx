import { auth } from "@/lib/auth"
import { logoutAction } from "./actions"

export default async function SystemPage() {
  const session = await auth()

  return (
    <div style={{ padding: "26px 24px" }}>
      <h1 style={{
        fontSize: "22px", fontWeight: 700,
        letterSpacing: "-0.5px", color: "var(--ink-1)",
        marginBottom: "24px",
      }}>
        Σύστημα
      </h1>

      {/* Account info */}
      <div className="hcard" style={{ marginBottom: "16px", maxWidth: "480px" }}>
        <div className="hcard-header">
          <span className="hcard-title">Λογαριασμός</span>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: "13px", color: "var(--ink-2)", marginBottom: "4px" }}>
            <strong>Όνομα:</strong> {session?.user?.name ?? "—"}
          </p>
          <p style={{ fontSize: "13px", color: "var(--ink-2)" }}>
            <strong>Email:</strong> {session?.user?.email ?? "—"}
          </p>
        </div>
      </div>

      {/* Logout */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="btn-secondary"
          style={{ color: "var(--clay-text)", borderColor: "var(--clay-border)" }}
        >
          Αποσύνδεση
        </button>
      </form>
    </div>
  )
}
