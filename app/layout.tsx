import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Yeşiltaş ERP - Profesyonel İşletme Yönetimi',
  description: 'Yeşiltaş Teknoloji için geliştirilmiş profesyonel ERP sistemi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
