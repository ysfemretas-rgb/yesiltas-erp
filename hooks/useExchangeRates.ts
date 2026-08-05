'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ExchangeRates {
  USD: number
  EUR: number
  lastUpdated: string
}

const STORAGE_KEY = 'yt_exchange_rates'
const REFRESH_MS = 5 * 60 * 1000 // 5 dakikada bir otomatik güncelle

// TEK MERKEZİ DÖVİZ KURU KAYNAĞI.
// Uygulamadaki HER sayfa (header widget, envanter, sarf malzeme, satış vb.)
// kuru buradan okumalı. Önceden 3 farklı sayfa 3 farklı API'den (frankfurter.dev,
// open.er-api.com, exchangerate-api.com) bağımsız kur çekiyordu; bu da aynı anda
// farklı ekranlarda farklı TRY tutarları gösterilmesine neden oluyordu.
// Artık tek kaynak (Frankfurter/ECB) + localStorage önbelleği kullanılıyor,
// böylece tüm sayfalar aynı anda aynı kuru gösterir.
export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates>(() => {
    if (typeof window === 'undefined') return { USD: 34.5, EUR: 37.2, lastUpdated: '' }
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) return JSON.parse(cached)
    } catch {
      // yoksay
    }
    return { USD: 34.5, EUR: 37.2, lastUpdated: '' }
  })
  const [isLoadingRates, setIsLoadingRates] = useState(false)

  const fetchRates = useCallback(async () => {
    setIsLoadingRates(true)
    try {
      const [usdRes, eurRes] = await Promise.all([
        fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=TRY'),
        fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=TRY'),
      ])
      if (!usdRes.ok || !eurRes.ok) throw new Error('Kur alınamadı')
      const usdData = await usdRes.json()
      const eurData = await eurRes.json()
      const usdRate = usdData.rates?.TRY || rates.USD
      const eurRate = eurData.rates?.TRY || rates.EUR

      const updated: ExchangeRates = {
        USD: Math.round(usdRate * 100) / 100,
        EUR: Math.round(eurRate * 100) / 100,
        lastUpdated: new Date().toLocaleString('tr-TR'),
      }
      setRates(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Döviz kuru alınamadı:', err)
    } finally {
      setIsLoadingRates(false)
    }
  }, [rates.USD, rates.EUR])

  useEffect(() => {
    fetchRates()
    const interval = setInterval(fetchRates, REFRESH_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { rates, isLoadingRates, fetchRates }
}
