'use client'

export function Pagination({
  currentPage, totalPages, goToPage, goToNext, goToPrev, totalItems, pageSize
}: {
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
  goToNext: () => void
  goToPrev: () => void
  totalItems?: number
  pageSize?: number
}) {
  if (totalPages <= 1) return null

  const pages: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
  }

  const btn = 'min-w-[2rem] h-8 px-2 rounded-md border text-sm transition-colors'
  const idle = 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800'
  const active = 'border-emerald-600 bg-emerald-600 text-white'

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap pt-3">
      {totalItems !== undefined && pageSize !== undefined ? (
        <span className="text-xs text-slate-500">
          {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} / {totalItems}
        </span>
      ) : <span />}
      <div className="flex items-center gap-1 flex-wrap">
        <button className={`${btn} ${idle}`} onClick={goToPrev} disabled={currentPage === 1}>&larr;</button>
        {pages.map((p, i) => (
          typeof p === 'number' ? (
            <button key={i} onClick={() => goToPage(p)} className={`${btn} ${p === currentPage ? active : idle}`}>{p}</button>
          ) : (
            <span key={i} className="px-1 text-slate-500">{p}</span>
          )
        ))}
        <button className={`${btn} ${idle}`} onClick={goToNext} disabled={currentPage === totalPages}>&rarr;</button>
      </div>
    </div>
  )
}
