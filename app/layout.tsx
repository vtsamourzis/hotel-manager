import type { Metadata, Viewport } from "next"
import { PwaProvider } from "@/components/PwaProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "AegeanSea Hotel",
  description: "Smart property management dashboard",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "hsl(198, 72%, 24%)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <head>
        {/* iOS PWA — must be explicit: Next.js 15 generates mobile-web-app-capable (Android)
            instead of apple-mobile-web-app-capable (iOS). Without this, Safari never goes standalone. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AegeanSea" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  )
}
