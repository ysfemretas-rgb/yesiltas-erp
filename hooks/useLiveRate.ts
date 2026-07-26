'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLiveRate() {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchRate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')

      if (!response.ok) throw new Error('Kur alınamadı')

      const data = await response.json()
      const tryRate = data.rates?.TRY

      if (tryRate) {
        setRate(tryRate)
        setLastUpdated(new Date())
      } else {
        throw new Error('TRY kuru bulunamadı')
      }
    } catch (err: any) {
      setError(err.message)
      try {
        const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml')
        const text = await response.text()
        const parser = new DOMParser()
        const xml = parser.parseFromString(text, 'text/xml')
        const usd = xml.querySelector('Currency[CurrencyCode="USD"] Buying')
        if (usd) {
          setRate(parseFloat(usd.textContent || '0'))
          setLastUpdated(new Date())
          setError(null)
        }
      } catch {
        setRate(34.50)
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

  return { rate, loading, error, lastUpdated, refresh: fetchRate }
}
