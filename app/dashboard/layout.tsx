"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const menuItems = [
  { href: "/dashboard", label: "Ana Sayfa", icon: "🏠" },
  { href: "/dashboard/devices", label: "Cihazlar", icon: "📱" },
  { href: "/dashboard/customers", label: "Musteriler", icon: "👥" },
  { href: "/dashboard/sales", label: "Satis", icon: "💰" },
  { href: "/dashboard/inventory", label: "Stok", icon: "📦" },
  { href: "/dashboard/finance", label: "Kasa", icon: "💳" },
  { href: "/dashboard/suppliers", label: "Tedarikciler", icon: "🏭" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 p-2 rounded-lg border border-slate-700 text-slate-300">{mobileMenuOpen ? "✕" : "☰"}</button>
      <aside className={`${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static z-40 w-64 h-full bg-slate-800 border-r border-slate-700 flex flex-col transition-transform`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-xl">🔧</div>
            <div><h1 className="text-lg font-bold text-white">Yeşiltaş</h1><p className="text-xs text-slate-400">Teknoloji</p></div>
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate">{userEmail}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`sidebar-link ${pathname === item.href ? "sidebar-link-active" : "sidebar-link-inactive"}`}>
              <span className="text-lg">{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full sidebar-link sidebar-link-inactive"><span className="text-lg">🚪</span><span>Cikis Yap</span></button>
        </div>
      </aside>
      {mobileMenuOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)} />}
      <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
    </div>
  );
}
