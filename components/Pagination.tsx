'use client'

export function Pagination({
  currentPage, totalPages, goToPage, goToNext, goToPrev
}: {
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
  goToNext: () => void
  goToPrev: () => void
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

  return (
    <div className="pagination">
      <button onClick={goToPrev} disabled={currentPage === 1}>&larr;</button>
      {pages.map((p, i) => (
        typeof p === 'number' ? (
          <button key={i} onClick={() => goToPage(p)} className={p === currentPage ? 'active' : ''}>{p}</button>
        ) : (
          <span key={i} style={{ padding: '0.375rem', color: 'var(--muted-foreground)' }}>{p}</span>
        )
      ))}
      <button onClick={goToNext} disabled={currentPage === totalPages}>&rarr;</button>
    </div>
  )
}
