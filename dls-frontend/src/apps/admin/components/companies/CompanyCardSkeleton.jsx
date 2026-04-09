export default function CompanyCardSkeleton() {
  return (
    <article className="animate-pulse rounded-[24px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--admin-shadow-sm)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-slate-200" />
          <div className="h-3 w-28 rounded bg-slate-100" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-3 w-48 rounded bg-slate-100" />
        <div className="h-3 w-44 rounded bg-slate-100" />
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div className="h-8 w-20 rounded bg-slate-100" />
        <div className="h-8 w-10 rounded bg-slate-200" />
      </div>
    </article>
  )
}
