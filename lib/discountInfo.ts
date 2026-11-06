// Müşteriye gösterilecek iskonto bilgisi (müşteri detayı, fişler, WhatsApp mesajları).
// Tamirde "cost" İSKONTO DÜŞÜLMÜŞ net ücrettir (iskonto ayrıca "discount" alanındadır); satışta totalAmount net toplamdır,
// iskonto = genel iskonto ("discount") + ürün satırı iskontoları (liste fiyatı − net fiyat). Borç kapatırken verilen indirimler de bu alanlara yazılır.
const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

export interface DiscountInfo {
  lineDiscount: number // ürün bazlı iskonto toplamı (satış)
  generalDiscount: number // genel / borç kapatma / tamir iskontosu
  total: number // toplam iskonto
  listTotal: number // iskontosuz liste tutarı (net toplam + iskonto)
}

export function saleDiscountInfo(sale: {
  totalAmount?: number
  discount?: number
  items?: { price?: number; quantity: number; listPrice?: number }[]
}): DiscountInfo {
  const lineDiscount = r2((sale.items || []).reduce((s, i) => s + (i.price !== undefined && i.listPrice && i.listPrice > i.price ? (i.listPrice - i.price) * i.quantity : 0), 0))
  const generalDiscount = r2(Math.max(0, sale.discount || 0))
  const total = r2(lineDiscount + generalDiscount)
  return { lineDiscount, generalDiscount, total, listTotal: r2((sale.totalAmount || 0) + total) }
}

export function repairDiscountInfo(repair: { cost?: number; discount?: number }): DiscountInfo {
  const generalDiscount = r2(Math.max(0, repair.discount || 0))
  return { lineDiscount: 0, generalDiscount, total: generalDiscount, listTotal: r2((repair.cost || 0) + generalDiscount) }
}
