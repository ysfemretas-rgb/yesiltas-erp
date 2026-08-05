import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Yeşiltaş Teknoloji - Teknik Servis Yönetimi",
  description: "Teknik servis yönetim sistemi",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/app-icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/app-icon-180x180.png",
  },
  openGraph: {
    title: "Yeşiltaş Teknoloji - Teknik Servis Yönetimi",
    description: "Teknik servis yönetim sistemi",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
