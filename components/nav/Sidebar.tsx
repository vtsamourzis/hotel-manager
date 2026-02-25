"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, BedDouble, BarChart2, Droplets,
  Zap, Settings, LifeBuoy
} from "lucide-react"
import { CacheIndicator } from "@/components/CacheIndicator"
import styles from "./nav.module.css"

interface SidebarProps {
  userName?: string
  userEmail?: string
  alertCount?: number
}

const NAV_ITEMS = [
  { href: "/overview",    Icon: LayoutDashboard, label: "Αρχική",       alertable: true },
  { href: "/rooms",       Icon: BedDouble,       label: "Δωμάτια",      alertable: false },
  { href: "/energy",      Icon: BarChart2,       label: "Ενέργεια",     alertable: false },
  { href: "/hotwater",    Icon: Droplets,        label: "Ζεστό Νερό",   alertable: false },
  { href: "/automations", Icon: Zap,             label: "Αυτοματισμοί", alertable: false },
  { href: "/system",      Icon: Settings,        label: "Σύστημα",      alertable: true },
  { href: "/support",     Icon: LifeBuoy,        label: "Υποστήριξη",   alertable: false },
] as const

export function Sidebar({ userName = "Manager", userEmail = "", alertCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.sidebarBrand}>
        <div className={styles.brandMark}>
          <LayoutDashboard size={14} strokeWidth={2.5} />
        </div>
        <div>
          <div className={styles.brandName}>
            {process.env.NEXT_PUBLIC_PROPERTY_NAME ?? "Hotel Manager"}
          </div>
          <div className={styles.brandSub}>Διαχείριση Ακινήτου</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className={styles.sidebarNav}>
        {NAV_ITEMS.map(({ href, Icon, label, alertable }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          const hasBadge = alertable && alertCount > 0 && href === "/overview"
          const hasSystemBadge = alertable && alertCount > 0 && href === "/system"

          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
              {(hasBadge || hasSystemBadge) && (
                <span style={{
                  marginLeft: "auto",
                  width: "7px", height: "7px",
                  background: "var(--clay)",
                  borderRadius: "50%",
                  flexShrink: 0,
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Cache/offline indicator */}
      <CacheIndicator />

      {/* User area */}
      <div className={styles.sidebarUser}>
        <div className={styles.userAvatar}>
          {(userName[0] ?? "M").toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className={styles.userName}>{userName}</div>
          <div className={styles.userRole}>{userEmail}</div>
        </div>
      </div>
    </aside>
  )
}
