import { HiBuildingOffice2, HiChevronRight, HiEnvelope, HiMapPin } from 'react-icons/hi2'

const SORTABLE_COLUMNS = [
  { key: 'company_name', label: 'Company' },
  { key: 'package_tier', label: 'Package' },
  { key: 'email_1', label: 'Contact' },
  { key: 'address', label: 'Address' },
  { key: 'delivery_count', label: 'Deliveries', align: 'right' },
]

function getAriaSort(columnKey, sortBy, sortDirection) {
  if (columnKey !== sortBy) return 'none'
  return sortDirection === 'asc' ? 'ascending' : 'descending'
}

function resolveCompanyInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function statusStyles(status) {
  if (status === 'active') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  return 'border-rose-100 bg-rose-50 text-rose-700'
}

export default function CompaniesDataTable({
  rows,
  sortBy,
  sortDirection,
  onSort,
  onOpenCompany,
  startIndex,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm" aria-label="Companies table">
          <caption className="sr-only">Company list with sorting and pagination controls</caption>
          <thead className="bg-[var(--admin-surface-soft)] text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
            <tr>
              <th className="w-14 px-5 py-3">#</th>
              {SORTABLE_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3 ${column.align === 'right' ? 'text-right' : ''}`}
                  aria-sort={getAriaSort(column.key, sortBy, sortDirection)}
                >
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 font-extrabold ${
                      column.align === 'right' ? 'ml-auto' : ''
                    }`}
                    onClick={() => onSort(column.key)}
                  >
                    {column.label}
                    <span aria-hidden="true" className="text-[10px]">
                      {sortBy === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                </th>
              ))}
              <th className="px-5 py-3" aria-label="Open company details" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((company, index) => {
              const companyName = company.company_name || 'Unnamed company'
              const status = (company.status || (company.is_active ? 'active' : 'inactive')).toLowerCase()
              const companyAddress = company.address || company.location || 'No address provided'
              const companyEmail = company.email_1 || 'No email provided'
              const deliveryCount =
                typeof company.delivery_count === 'number'
                  ? company.delivery_count
                  : typeof company.deliveryCount === 'number'
                    ? company.deliveryCount
                    : 0

              return (
                <tr
                  key={company.id}
                  onClick={() => onOpenCompany(company)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onOpenCompany(company)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group cursor-pointer transition hover:bg-[var(--admin-surface-soft)]"
                  aria-label={`Open details for ${companyName}`}
                >
                  <td className="px-5 py-4 text-xs font-semibold text-slate-400">{startIndex + index + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent)] font-bold text-slate-900">
                        {resolveCompanyInitials(companyName) || <HiBuildingOffice2 className="text-lg" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{companyName}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusStyles(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">{company.package_tier || 'Business Package'}</td>

                  <td className="px-5 py-4">
                    <p className="flex items-center gap-2 truncate">
                      <HiEnvelope className="shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{companyEmail}</span>
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="flex items-center gap-2 truncate">
                      <HiMapPin className="shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{companyAddress}</span>
                    </p>
                  </td>

                  <td className="px-5 py-4 text-right text-xl font-extrabold leading-none">{deliveryCount}</td>

                  <td className="px-5 py-4 text-right">
                    <HiChevronRight className="ml-auto text-lg text-slate-400 transition group-hover:translate-x-0.5" />
                  </td>
                </tr>
              )
            })}
          </tbody>
      </table>
    </div>
  )
}
