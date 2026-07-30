import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yeşiltaş Teknoloji ERP',
  description: 'Teknik Servis ve Satış Yönetim Sistemi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
