import test from "node:test"
import assert from "node:assert/strict"
import { stockGroupOf, desiredMinQuantity, alertOnMinQuantity, normalizeStockAlertConfig, DEFAULT_STOCK_ALERT_CONFIG, STOCK_GROUPS } from "../lib/stockAlerts.ts"

test("kategoriler doğru gruba düşer (envanterdeki gerçek kategori adları)", () => {
  assert.equal(stockGroupOf("Telefon (İkinci El)"), "devices")
  assert.equal(stockGroupOf("Telefon (Sıfır)"), "devices")
  assert.equal(stockGroupOf("Tablet"), "devices")
  assert.equal(stockGroupOf("Kılıf"), "phoneAcc")
  assert.equal(stockGroupOf("Ekran Koruyucu (Cam)"), "phoneAcc")
  assert.equal(stockGroupOf("Şarj / Data Kablosu"), "genAcc")
  assert.equal(stockGroupOf("Şarj Aleti (Adaptör)"), "genAcc")
  assert.equal(stockGroupOf("Yedek Parça - Ekran"), "parts")
  assert.equal(stockGroupOf("Yedek Parça - Batarya"), "parts")
  assert.equal(stockGroupOf("Diğer"), "other")
  assert.equal(stockGroupOf(""), "other")
  assert.equal(stockGroupOf(undefined), "other")
})

test("katalogda olmayan (elle yazılmış) kategoriler tahmin edilir", () => {
  assert.equal(stockGroupOf("yedek parça ekran"), "parts")
  assert.equal(stockGroupOf("Samsung Kılıfı"), "phoneAcc")
  assert.equal(stockGroupOf("iPhone telefon"), "devices")
  assert.equal(stockGroupOf("Lehim malzemesi"), "other")
})

test("varsayılan ayar: telefon ve yedek parçada uyarı kapalı (0), aksesuarlarda açık", () => {
  const c = DEFAULT_STOCK_ALERT_CONFIG
  assert.equal(desiredMinQuantity("Telefon (İkinci El)", c), 0)
  assert.equal(desiredMinQuantity("Yedek Parça - Batarya", c), 0)
  assert.equal(desiredMinQuantity("Kılıf", c), 5)
  assert.equal(desiredMinQuantity("Ekran Koruyucu (Cam)", c), 5)
  assert.equal(desiredMinQuantity("Şarj / Data Kablosu", c), 5)
  assert.equal(desiredMinQuantity("Diğer", c), 5)
})

test("uyarıyı elle AÇARKEN grup kapalı olsa bile en az 1 adet minimum verilir", () => {
  assert.equal(alertOnMinQuantity("Telefon (İkinci El)", DEFAULT_STOCK_ALERT_CONFIG), 1)
  assert.equal(alertOnMinQuantity("Yedek Parça - Ekran", DEFAULT_STOCK_ALERT_CONFIG), 2)
  assert.equal(alertOnMinQuantity("Kılıf", DEFAULT_STOCK_ALERT_CONFIG), 5)
})

test("ayar eksik/bozuk gelirse varsayılanla tamamlanır; kullanıcının değerleri korunur", () => {
  assert.deepEqual(normalizeStockAlertConfig(undefined), DEFAULT_STOCK_ALERT_CONFIG)
  assert.deepEqual(normalizeStockAlertConfig("bozuk"), DEFAULT_STOCK_ALERT_CONFIG)
  const c = normalizeStockAlertConfig({ parts: { enabled: true, min: 3 }, genAcc: { enabled: false, min: -4 }, devices: { min: "x" } })
  assert.deepEqual(c.parts, { enabled: true, min: 3 })
  assert.deepEqual(c.genAcc, { enabled: false, min: 5 }) // geçersiz adet varsayılana döner
  assert.deepEqual(c.devices, DEFAULT_STOCK_ALERT_CONFIG.devices)
  assert.equal(STOCK_GROUPS.length, 5)
  assert.equal(desiredMinQuantity("Yedek Parça - Ekran", c), 3) // kullanıcı yedek parçada uyarıyı açtı
})
