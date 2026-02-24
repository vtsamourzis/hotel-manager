import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/nav/Sidebar"
import { BottomNav } from "@/components/nav/BottomNav"
import { HAProvider } from "@/providers/HAProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import { OfflineOverlay } from "@/components/OfflineOverlay"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <QueryProvider>
    <HAProvider>
      <div style={{
        width: "100%",
        display: "flex",
        height: "100%",
        background: "var(--canvas)",
        overflow: "hidden",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <Sidebar
          userName={session.user?.name ?? "Manager"}
          userEmail={session.user?.email ?? ""}
        />

        <main style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          minWidth: 0,
        }}>
          <div className="page-scroll" style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Full-screen overlay when HA connection is lost */}
      <OfflineOverlay />
    </HAProvider>
    </QueryProvider>
  )
}
