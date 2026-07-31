"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface Sale {
  id: string
  total_price: number
  remaining_amount: number
  created_at: string
}

interface Debt {
  id: string
  customer_name: string
  amount: number
  paid_amount: number
  status: string
}

interface Warranty {
  id: string
  customer_name: string
  item_name: string
  warranty_end_date: string
  status: string
}

interface Device {
  id: string
  status: string
}

interface Transaction {
  id: string
  type: string
  amount: number
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const s = await supabase.from("sales").select("id, total_price, remaining_amount, created_at")
    if (s.data) setSales(s.data)
    const d = await supabase.from("debts").select("*")
    if (d.data) setDebts(d.data)
    const w = await supabase.from("warranties").select("*")
    if (w.data) setWarranties(w.data)
    const dev = await supabase.from("devices").select("id, status")
    if (dev.data) setDevices(dev.data)
    const t = await supabase.from("transactions").select("id, type, amount")
    if (t.data) setTransactions(t.data)
    setLoading(false)
  }

  function formatPrice(price: number) {
    return price.toLocaleString("tr-TR") + " TL"
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-"
    const d = new Date(dateStr)
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
  }

  let totalRevenue = 0
  let totalDebt = 0
  for (let i = 0; i < sales.length; i++) {
    totalRevenue = totalRevenue + sales[i].total_price
    totalDebt = totalDebt + sales[i].remaining_amount
  }

  let unpaidDebts = 0
  let unpaidDebtAmount = 0
  for (let i = 0; i < debts.length; i++) {
    if (debts[i].status === "unpaid") {
      unpaidDebts++
      unpaidDebtAmount = unpaidDebtAmount + debts[i].amount - (debts[i].paid_amount || 0)
    }
  }

  let activeWarranties = 0
  let expiredWarranties = 0
  for (let i = 0; i < warranties.length; i++) {
    if (warranties[i].status === "active" && warranties[i].warranty_end_date) {
      if (new Date(warranties[i].warranty_end_date) >= new Date()) activeWarranties++
      else expiredWarranties++
    }
  }

  let waitingDevices = 0
  let inProgressDevices = 0
  for (let i = 0; i < devices.length; i++) {
    if (devices[i].status === "waiting") waitingDevices++
    if (devices[i].status === "in_progress") inProgressDevices++
  }

  let totalIncome = 0
  let totalExpense = 0
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "income") totalIncome = totalIncome + transactions[i].amount
    else totalExpense = totalExpense + transactions[i].amount
  }

  const recentDebts: Debt[] = []
  for (let i = 0; i < debts.length && recentDebts.length < 5; i++) {
    if (debts[i].status === "unpaid") recentDebts.push(debts[i])
  }

  const recentWarranties: Warranty[] = []
  for (let i = 0; i < warranties.length && recentWarranties.length < 5; i++) {
    recentWarranties.push(warranties[i])
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="card-header"><h3 className="card-title">Toplam Satis</h3></div>
              <div className="card-content"><p className="text-2xl font-bold">{sales.length}</p></div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Toplam Ciro</h3></div>
              <div className="card-content"><p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p></div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Bekleyen Cihaz</h3></div>
              <div className="card-content"><p className="text-2xl font-bold text-yellow-600">{waitingDevices}</p></div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Bakiye</h3></div>
              <div className="card-content"><p className={"text-2xl font-bold " + (totalIncome - totalExpense >= 0 ? "text-green-600" : "text-red-600")}>{formatPrice(totalIncome - totalExpense)}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Borclar ({unpaidDebts})</h3>
              </div>
              <div className="card-content">
                {recentDebts.length === 0 ? (
                  <div className="empty-state">Borc bulunmuyor.</div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Musteri</th>
                          <th>Borc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentDebts.map(function(debt) {
                          return (
                            <tr key={debt.id}>
                              <td>{debt.customer_name}</td>
                              <td className="text-red-600 font-bold">{formatPrice(debt.amount - (debt.paid_amount || 0))}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 p-3 bg-red-50 rounded">
                  <p className="text-red-700 font-bold">Toplam Borc: {formatPrice(unpaidDebtAmount)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Garantiler</h3>
              </div>
              <div className="card-content">
                {recentWarranties.length === 0 ? (
                  <div className="empty-state">Garanti bulunmuyor.</div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Musteri</th>
                          <th>Urun</th>
                          <th>Bitis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentWarranties.map(function(w) {
                          const expired = w.warranty_end_date && new Date(w.warranty_end_date) < new Date()
                          return (
                            <tr key={w.id}>
                              <td>{w.customer_name}</td>
                              <td>{w.item_name}</td>
                              <td>
                                <span className={"badge " + (expired ? "badge-red" : "badge-green")}>
                                  {formatDate(w.warranty_end_date)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 flex gap-4">
                  <div className="p-3 bg-green-50 rounded flex-1">
                    <p className="text-green-700 font-bold">Aktif: {activeWarranties}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded flex-1">
                    <p className="text-red-700 font-bold">Suresi Dolan: {expiredWarranties}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
