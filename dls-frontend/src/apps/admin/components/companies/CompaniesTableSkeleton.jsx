export default function CompaniesTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm" aria-hidden="true">
          <thead className="bg-[var(--admin-surface-soft)] text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Package</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Address</th>
              <th className="px-5 py-3 text-right">Deliveries</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                <td className="px-5 py-4">
                  <div className="h-4 w-8 animate-pulse rounded bg-slate-300/60" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-5 w-44 animate-pulse rounded bg-slate-300/60" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-5 w-28 animate-pulse rounded bg-slate-300/60" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-5 w-52 animate-pulse rounded bg-slate-300/60" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-5 w-56 animate-pulse rounded bg-slate-300/60" />
                </td>
                <td className="px-5 py-4">
                  <div className="ml-auto h-5 w-10 animate-pulse rounded bg-slate-300/60" />
                </td>
                <td className="px-5 py-4">
                  <div className="ml-auto h-5 w-5 animate-pulse rounded bg-slate-300/60" />
                </td>
              </tr>
            ))}
          </tbody>
      </table>
    </div>
  )
}
