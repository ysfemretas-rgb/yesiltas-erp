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
  var [sales, setSales] = useState<Sale[]>([])
  var [debts, setDebts] = useState<Debt[]>([])
  var [warranties, setWarranties] = useState<Warranty[]>([])
  var [devices, setDevices] = useState<Device[]>([])
  var [transactions, setTransactions] = useState<Transaction[]>([])
  var [loading, setLoading] = useState(true)

  useEffect(function() {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    var s = await supabase.from("sales").select("id, total_price, remaining_amount, created_at")
    if (s.data) setSales(s.data)
    var d = await supabase.from("debts").select("*")
    if (d.data) setDebts(d.data)
    var w = await supabase.from("warranties").select("*")
    if (w.data) setWarranties(w.data)
    var dev = await supabase.from("devices").select("id, status")
    if (dev.data) setDevices(dev.data)
    var t = await supabase.from("transactions").select("id, type, amount")
    if (t.data) setTransactions(t.data)
    setLoading(false)
  }

  function formatPrice(price: number) {
    return price.toLocaleString("tr-TR") + " TL"
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-"
    var d = new Date(dateStr)
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
  }

  // Hesaplamalar
  var totalRevenue = 0
  var totalDebt = 0
  for (var i = 0; i < sales.length; i++) {
    totalRevenue = totalRevenue + sales[i].total_price
    totalDebt = totalDebt + sales[i].remaining_amount
  }

  var unpaidDebts = 0
  var unpaidDebtAmount = 0
  for (var i = 0; i < debts.length; i++) {
    if (debts[i].status === "unpaid") {
      unpaidDebts++
      unpaidDebtAmount = unpaidDebtAmount + debts[i].amount - (debts[i].paid_amount || 0)
    }
  }

  var activeWarranties = 0
  var expiredWarranties = 0
  for (var i = 0; i < warranties.length; i++) {
    if (warranties[i].status === "active" && warranties[i].warranty_end_date) {
      if (new Date(warranties[i].warranty_end_date) >= new Date()) activeWarranties++
      else expiredWarranties++
    }
  }

  var waitingDevices = 0
  var inProgressDevices = 0
  for (var i = 0; i < devices.length; i++) {
    if (devices[i].status === "waiting") waitingDevices++
    if (devices[i].status === "in_progress") inProgressDevices++
  }

  var totalIncome = 0
  var totalExpense = 0
  for (var i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "income") totalIncome = totalIncome + transactions[i].amount
    else totalExpense = totalExpense + transactions[i].amount
  }

  // Son 5 borç
  var recentDebts: Debt[] = []
  for (var i = 0; i < debts.length && recentDebts.length < 5; i++) {
    if (debts[i].status === "unpaid") recentDebts.push(debts[i])
  }

  // Son 5 garanti
  var recentWarranties: Warranty[] = []
  for (var i = 0; i < warranties.length && recentWarranties.length < 5; i++) {
    recentWarranties.push(warranties[i])
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="card-header"><h3 className="card-title">Toplam Satış</h3></div>
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
            {/* Borçlar Kartı */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Borçlar ({unpaidDebts})</h3>
              </div>
              <div className="card-content">
                {recentDebts.length === 0 ? (
                  <div className="empty-state">Borç bulunmuyor.</div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Müşteri</th>
                          <th>Borç</th>
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
                  <p className="text-red-700 font-bold">Toplam Borç: {formatPrice(unpaidDebtAmount)}</p>
                </div>
              </div>
            </div>

            {/* Garantiler Kartı */}
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
                          <th>Müşteri</th>
                          <th>Ürün</th>
                          <th>Bitiş</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentWarranties.map(function(w) {
                          var expired = w.warranty_end_date && new Date(w.warranty_end_date) < new Date()
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
                    <p className="text-red-700 font-bold">Süresi Dolan: {expiredWarranties}</p>
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
