"use client"

import * as React from "react"
import { Input, InputProps } from "@/components/ui/input"
import { normalizePhoneTR } from "@/lib/phone"

// Telefon kutusu: telefonda sayı tuş takımı açılır; yapıştırılan "+90 (532) 123 45 67" gibi numara kendiliğinden 05321234567 olur.
// onChange'e giden olayın e.target.value değeri düzeltilmiş numaradır (mevcut kodlar değişmeden çalışır).
export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(function PhoneInput({ onChange, ...props }, ref) {
  return (
    <Input
      {...props}
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      onChange={(e) => {
        const v = normalizePhoneTR(e.target.value)
        if (v !== e.target.value) e.target.value = v
        onChange?.(e)
      }}
    />
  )
})
