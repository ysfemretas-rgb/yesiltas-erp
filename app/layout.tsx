import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Yeşiltaş ERP - Ana Sayfa",
  description: "Yeşiltaş Telefon ERP Sistemi",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}