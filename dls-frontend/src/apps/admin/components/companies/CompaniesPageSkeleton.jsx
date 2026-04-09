import CompanyCardSkeleton from './CompanyCardSkeleton'

export default function CompaniesPageSkeleton() {
  return (
    <section className="space-y-4">
      <div className="mx-auto flex w-full flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-11 w-56 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-11 w-full max-w-md rounded-full bg-slate-200 md:w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <CompanyCardSkeleton key={`company-page-skeleton-${index}`} />
        ))}
      </div>
    </section>
  )
}
