import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: process.env.PROPERTY_NAME ?? "Hotel Manager",
  description: "Smart property management dashboard",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "hsl(198, 72%, 24%)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  )
}
