import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/nav/Sidebar"
import { BottomNav } from "@/components/nav/BottomNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "var(--canvas)",
      overflow: "hidden",
    }}>
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <div style={{ display: "contents" }} className="desktop-nav">
        <Sidebar
          userName={session.user?.name ?? "Manager"}
          userEmail={session.user?.email ?? ""}
        />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        minWidth: 0,
      }}>
        <div
          className="page-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "var(--mobile-nav-h)",
          }}
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — hidden on desktop via CSS */}
      <div style={{ display: "contents" }} className="mobile-nav">
        <BottomNav />
      </div>
    </div>
  )
}
