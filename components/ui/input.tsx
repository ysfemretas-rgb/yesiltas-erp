import * as React from "react"
import { cn } from "@/lib/utils"
import { sanitizeNumberText, parseNumberText, finalizeNumberText } from "@/lib/numberInput"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const BASE_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

// Sayı kutusu (type="number"): telefonda SAYI TUŞ TAKIMI açılır (inputMode), baştaki gereksiz sıfırlar silinir (050 → 50),
// kutu tamamen boşaltılabilir (üst bileşen 0 tutsa bile "0" geri yazılmaz). Kutu boş bırakılıp çıkılırsa otomatik 0 olur (en az değeri
// olan kutuda o değer). Boş bırakmanın anlamı olan kutularda data-allow-empty verilir ("Boş = otomatik" gibi).
const NumberInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type: _type, value, defaultValue, onChange, onBlur, inputMode, min, ...props }, ref) => {
    const toText = (v: unknown) => (v === undefined || v === null ? "" : String(v))
    const allowNegative = min === undefined || Number(min) < 0
    const [text, setText] = React.useState(() => toText(value ?? defaultValue))
    const allowEmpty = (props as Record<string, unknown>)["data-allow-empty"] !== undefined
    const emptyValue = allowEmpty ? "" : min !== undefined && Number(min) > 0 ? String(min) : "0"

    // Dışarıdan gelen değer değişirse (form sıfırlandı, ürün seçildi...) metni eşitle; aynı sayıysa yerel metni koru
    React.useEffect(() => {
      if (value === undefined) return
      const incoming = toText(value)
      const inNum = parseNumberText(incoming)
      const localNum = parseNumberText(text)
      if (inNum === localNum) return
      if (localNum === null && inNum === 0) return // kutu boş bırakıldı, üst bileşen 0 tutuyor: boş kalsın
      if (localNum === 0 && incoming.trim() === "") return // üst bileşen 0'ı boş gösteriyor ("0 || \"\""): yazılan 0 kaybolmasın
      setText(incoming)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    const emit = (e: React.SyntheticEvent<HTMLInputElement>, t: string) => {
      e.currentTarget.value = t
      onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode={inputMode ?? "decimal"}
        autoComplete="off"
        value={text}
        className={cn(BASE_CLASS, className)}
        onChange={(e) => {
          const t = sanitizeNumberText(e.target.value, allowNegative)
          setText(t)
          emit(e, parseNumberText(t) === null ? "" : t) // yarım yazılmış ("-", ".") metin üst bileşene boş gider (eski sayı kutusuyla aynı)
        }}
        onBlur={(e) => {
          const t = finalizeNumberText(text, emptyValue)
          if (t !== text) {
            setText(t)
            emit(e, t)
          }
          onBlur?.(e)
        }}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    if (type === "number") return <NumberInput ref={ref} className={className} {...props} />
    return (
      <input
        type={type}
        className={cn(BASE_CLASS, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
