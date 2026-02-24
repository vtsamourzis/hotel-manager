import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: process.env.PROPERTY_NAME ?? "Hotel Manager",
  description: "Smart property management dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
