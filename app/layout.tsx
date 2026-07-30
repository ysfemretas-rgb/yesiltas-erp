import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yeşiltaş Teknoloji ERP",
  description: "Yeşiltaş Teknoloji İşletme Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
