"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    customers: 0,
    projects: 0,
    employees: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: customerCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      setStats({
        customers: customerCount || 0,
        projects: projectCount || 0,
        employees: employeeCount || 0,
      });
    };

    fetchStats();
  }, []);

  const cards = [
    { label: "Musteriler", value: stats.customers, href: "/dashboard/customers", icon: "👥", color: "bg-blue-50 text-blue-700" },
    { label: "Projeler", value: stats.projects, href: "/dashboard/projects", icon: "📁", color: "bg-green-50 text-green-700" },
    { label: "Calisanlar", value: stats.employees, href: "/dashboard/employees", icon: "👷", color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Ana Sayfa</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.color}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Hos Geldiniz</h3>
        <p className="text-slate-600">
          Yeşiltaş ERP sistemine hoş geldiniz. Sol menuden istediğiniz modulu secerek calismaya baslayabilirsiniz.
        </p>
      </div>
    </div>
  );
}
