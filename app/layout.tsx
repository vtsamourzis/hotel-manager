import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: process.env.PROPERTY_NAME ?? "Hotel Manager",
  description: "Smart property management dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  )
}
