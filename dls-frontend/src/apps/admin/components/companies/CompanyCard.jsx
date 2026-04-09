import { HiBuildingOffice2, HiEnvelope, HiMapPin, HiChevronRight } from 'react-icons/hi2'

function resolveCompanyType(packageTier = '') {
  const normalized = packageTier.toLowerCase()

  if (normalized.includes('virtual office')) return 'Virtual Office'
  if (normalized.includes('use of address')) return 'Address Service'
  if (normalized.includes('cowork')) return 'Coworking Membership'
  if (normalized.includes('dedicated')) return 'Dedicated Office'

  return packageTier || 'Business Package'
}

function resolveDeliveryCount(company) {
  if (typeof company.delivery_count === 'number') return company.delivery_count
  if (typeof company.deliveryCount === 'number') return company.deliveryCount
  return 0
}

export default function CompanyCard({ company, onClick }) {
  const deliveryCount = resolveDeliveryCount(company)

  return (
    <article
      className="group cursor-pointer rounded-[24px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--admin-shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--admin-shadow-lg)]"
      onClick={() => onClick(company)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(company)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${company.company_name}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--admin-accent)] text-slate-900 shadow-sm">
            <HiBuildingOffice2 className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold leading-tight text-[var(--admin-heading)]">{company.company_name}</h3>
            <p className="text-sm text-[var(--admin-muted)]">{resolveCompanyType(company.package_tier)}</p>
          </div>
        </div>
        <HiChevronRight className="mt-1 text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--admin-accent-strong)]" />
      </div>

      <div className="space-y-2 text-sm text-[var(--admin-muted)]">
        <p className="flex items-center gap-2">
          <HiEnvelope className="text-slate-400" />
          <span className="truncate">{company.email_1 || 'No email provided'}</span>
        </p>
        <p className="flex items-center gap-2">
          <HiMapPin className="text-slate-400" />
          <span>Suite 1, Launchpad Coworking</span>
        </p>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div className="rounded-xl bg-[var(--admin-surface-soft)] px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">Deliveries</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <p className="text-3xl font-black leading-none text-[var(--admin-heading)]">{deliveryCount}</p>
      </div>
    </article>
  )
}
