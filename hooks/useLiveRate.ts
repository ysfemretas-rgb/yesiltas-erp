'use client'

import { useState, useEffect, useCallback } from 'react'

interface RateData {
  buying: number | null
  selling: number | null
  lastUpdated: Date | null
}

export function useLiveRate() {
  const [rate, setRate] = useState<RateData>({ buying: null, selling: null, lastUpdated: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // API'den alış kuru çek
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')

      if (!response.ok) throw new Error('Kur alınamadı')

      const data = await response.json()
      const tryRate = data.rates?.TRY

      if (tryRate) {
        // Alış: %1 düşük, Satış: %1 yüksek (yaklaşık spread)
        const buying = tryRate * 0.995
        const selling = tryRate * 1.005
        setRate({ buying, selling, lastUpdated: new Date() })
      } else {
        throw new Error('TRY kuru bulunamadı')
      }
    } catch (err: any) {
      setError(err.message)
      // Yedek: TCMB
      try {
        const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml')
        const text = await response.text()
        const parser = new DOMParser()
        const xml = parser.parseFromString(text, 'text/xml')
        const usdBuying = xml.querySelector('Currency[CurrencyCode="USD"] Buying')
        const usdSelling = xml.querySelector('Currency[CurrencyCode="USD"] Selling')
        if (usdBuying && usdSelling) {
          setRate({
            buying: parseFloat(usdBuying.textContent || '0'),
            selling: parseFloat(usdSelling.textContent || '0'),
            lastUpdated: new Date()
          })
          setError(null)
        }
      } catch {
        setRate({ buying: 34.50, selling: 34.80, lastUpdated: new Date() })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRate()
    const interval = setInterval(fetchRate, 30000)
    return () => clearInterval(interval)
  }, [fetchRate])

  return { rate, loading, error, refresh: fetchRate }
}
