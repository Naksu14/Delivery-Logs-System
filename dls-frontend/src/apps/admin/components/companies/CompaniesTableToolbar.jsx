import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

export default function CompaniesTableToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  typeOptions,
}) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:max-w-4xl xl:grid-cols-3">
          <label className="relative block">
            <span className="sr-only">Search companies</span>
            <HiOutlineMagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              type="search"
              placeholder="Search name, email, or address"
              aria-label="Search companies"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-lime-500"
            />
          </label>

          <label className="block">
            <span className="sr-only">Filter by package type</span>
            <select
              value={typeFilter}
              onChange={(event) => onTypeFilterChange(event.target.value)}
              aria-label="Filter by package type"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-lime-500"
            >
              <option value="">All package types</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              aria-label="Filter by status"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-lime-500"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

      </div>
    </div>
  )
}
