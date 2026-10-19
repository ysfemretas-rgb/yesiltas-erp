// Kritik değişikliklerde "eski değer → yeni değer" metni üretmek için saf yardımcılar.
// (Hiçbir içe aktarma içermez; testlerde doğrudan çalıştırılabilir.)

export interface FieldChange {
  label: string
  from: string
  to: string
}

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "number") return String(Math.round(v * 100) / 100)
  return String(v)
}

// before/after nesnelerinde `fields` içinde verilen alanları karşılaştırır, değişenleri döndürür.
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: { key: string; label: string }[]
): FieldChange[] {
  const out: FieldChange[] = []
  for (const f of fields) {
    const a = show(before[f.key])
    const b = show(after[f.key])
    if (a !== b) out.push({ label: f.label, from: a, to: b })
  }
  return out
}

export function formatChanges(changes: FieldChange[]): string {
  return changes.map((c) => `${c.label}: ${c.from} → ${c.to}`).join("; ")
}
