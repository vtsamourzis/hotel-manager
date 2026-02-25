"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, BedDouble, BarChart2, Droplets,
  Zap, Settings, LifeBuoy
} from "lucide-react"
import styles from "./nav.module.css"

const NAV_ITEMS = [
  { href: "/overview",    Icon: LayoutDashboard, label: "Αρχική" },
  { href: "/rooms",       Icon: BedDouble,       label: "Δωμάτια" },
  { href: "/energy",      Icon: BarChart2,       label: "Ενέργεια" },
  { href: "/hotwater",    Icon: Droplets,        label: "Ζεστό Νερό" },
  { href: "/automations", Icon: Zap,             label: "Αυτοματισμοί" },
  { href: "/system",      Icon: Settings,        label: "Σύστημα" },
  { href: "/support",     Icon: LifeBuoy,        label: "Υποστήριξη" },
] as const

export function BottomNav({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className={styles.bottomNav}>
      {NAV_ITEMS.map(({ href, Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ""}`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
