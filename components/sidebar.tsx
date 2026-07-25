"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, Users, Wrench, Package, ShoppingCart,
  DollarSign, FileText, Settings, Menu, ChevronLeft, ChevronRight, Briefcase,
} from "lucide-react";

const menuItems = [
  { name: "Ana Sayfa", href: "/dashboard", icon: LayoutDashboard },
  { name: "Müşteriler", href: "/dashboard/customers", icon: Users },
  { name: "Teknik Servis", href: "/dashboard/services", icon: Wrench },
  { name: "Stok", href: "/dashboard/inventory", icon: Package },
  { name: "Satış", href: "/dashboard/sales", icon: ShoppingCart },
  { name: "Finans", href: "/dashboard/finance", icon: DollarSign },
  { name: "Ortaklık", href: "/dashboard/partners", icon: Briefcase },
  { name: "Raporlar", href: "/dashboard/reports", icon: FileText },
  { name: "Ayarlar", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  return (
    <>
      <aside className={cn("hidden lg:flex flex-col border-r bg-background h-screen sticky top-0 transition-all duration-300", collapsed ? "w-20" : "w-64")}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="YT" className="h-8 w-auto object-contain" />
              <span className="text-lg font-bold text-primary">Yeşiltaş ERP</span>
            </div>
          )}
          {collapsed && <img src="/logo.png" alt="YT" className="h-8 w-auto object-contain mx-auto" />}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className={collapsed ? "mx-auto" : "ml-auto"}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent", isActive ? "bg-accent text-primary" : "text-muted-foreground", collapsed && "justify-center px-2")}>
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="m-2"><Menu className="h-6 w-6" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex items-center h-16 px-4 border-b gap-2">
              <img src="/logo.png" alt="YT" className="h-8 w-auto object-contain" />
              <span className="text-lg font-bold text-primary">Yeşiltaş ERP</span>
            </div>
            <nav className="py-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className={cn("flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent", isActive ? "bg-accent text-primary" : "text-muted-foreground")}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
