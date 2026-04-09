import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'

export default function CompanySearchBar({ value, onChange }) {
  return (
    <div className="relative w-full max-w-md">
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search company"
        aria-label="Search companies"
        className="admin-input-control h-11 w-full rounded-full pl-11 pr-4"
      />
    </div>
  )
}
