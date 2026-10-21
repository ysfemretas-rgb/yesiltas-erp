// Kasa toplamları: iptal/iade gibi TERS KAYITLAR brüt gelir/gideri şişirmesin diye ilgili tarafa mahsup edilir.
// (Kasadaki net değişmez; sadece "Toplam Gelir" ve "Toplam Gider" gerçeği daha doğru gösterir.)
// Hiçbir içe aktarma yok; testle doğrulanır.

// Gider olarak yazılan ama aslında GELİRDEN düşen kayıtlar
export const REVERSAL_OF_INCOME = ["Satış İptali", "Satış İadesi"]
// Gelir olarak yazılan ama aslında GİDERDEN düşen kayıtlar
export const REVERSAL_OF_EXPENSE = ["Eşantiyon İptali", "Tedarikçi İadesi"]

export interface TxLike {
  type: "income" | "expense"
  amount: number
  category: string
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function netTotals(txs: TxLike[]): { income: number; expense: number; net: number } {
  let income = 0
  let expense = 0
  for (const t of txs) {
    const a = Number(t.amount) || 0
    if (t.type === "income") {
      if (REVERSAL_OF_EXPENSE.includes(t.category)) expense -= a
      else income += a
    } else {
      if (REVERSAL_OF_INCOME.includes(t.category)) income -= a
      else expense += a
    }
  }
  return { income: r2(income), expense: r2(expense), net: r2(income - expense) }
}
