function getVisiblePages(currentPage, totalPages) {
  const pages = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
}

export default function CompaniesTablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const visiblePages = getVisiblePages(page, totalPages)
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  const buttonStyle = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'

  return (
    <div
      className="flex flex-col gap-3 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
      aria-label="Pagination controls"
    >
      <div className="text-sm">
        Showing <span className="font-semibold">{from}</span> to <span className="font-semibold">{to}</span> of{' '}
        <span className="font-semibold">{totalItems}</span> companies
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={`rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyle}`}
          aria-label="Go to previous page"
        >
          Prev
        </button>

        {visiblePages.map((visiblePage) => (
          <button
            key={visiblePage}
            type="button"
            onClick={() => onPageChange(visiblePage)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              visiblePage === page
                ? 'border-lime-600 bg-lime-500 text-slate-950'
                : buttonStyle
            }`}
            aria-current={visiblePage === page ? 'page' : undefined}
            aria-label={`Go to page ${visiblePage}`}
          >
            {visiblePage}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={`rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyle}`}
          aria-label="Go to next page"
        >
          Next
        </button>

        <label className="ml-2 flex items-center gap-2 text-sm">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className={`rounded-lg border px-2 py-1 text-sm ${buttonStyle}`}
            aria-label="Rows per page"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>
    </div>
  )
}
