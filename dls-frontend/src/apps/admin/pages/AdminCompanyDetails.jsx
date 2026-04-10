import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HiArrowLeft, HiBuildingOffice2, HiEnvelope, HiIdentification, HiMapPin } from 'react-icons/hi2'
import AdminPageHeader from '../components/AdminPageHeader'
import { getCompanyById } from '../../../services/companyAPIServices'

function resolveCompanyType(packageTier = '') {
  const normalized = packageTier.toLowerCase()

  if (normalized.includes('virtual office')) return 'Virtual Office'
  if (normalized.includes('use of address')) return 'Address Service'
  if (normalized.includes('cowork')) return 'Coworking Membership'
  if (normalized.includes('dedicated')) return 'Dedicated Office'

  return packageTier || 'Business Package'
}

function resolveDeliveryCount(company) {
  if (typeof company?.delivery_count === 'number') return company.delivery_count
  if (typeof company?.deliveryCount === 'number') return company.deliveryCount
  return 0
}

export default function AdminCompanyDetails() {
  const { companyId } = useParams()

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company-details', companyId],
    queryFn: () => getCompanyById(companyId),
    enabled: Boolean(companyId),
  })

  return (
    <section className="space-y-6">
      <Link
        to="/admin/companies"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-lime-300 hover:bg-lime-50"
      >
        <HiArrowLeft />
        Back to Companies
      </Link>

      {isLoading ? (
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-52 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-72 rounded bg-slate-100" />
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`detail-skeleton-${index}`} className="h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load company details.
        </div>
      ) : null}

      {!isLoading && !isError && company ? (
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_26px_rgba(15,23,42,0.08)]">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-lime-400 text-slate-900">
              <HiBuildingOffice2 className="text-2xl" />
            </div>
            <div>
              <span className="text-3xl font-black tracking-tight text-slate-900">{company.company_name}</span>
              <p className="mt-1 text-sm text-slate-500">{resolveCompanyType(company.package_tier)}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <HiEnvelope className="text-slate-400" />
                {company.email_1 || 'No email provided'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Person</p>
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <HiIdentification className="text-slate-400" />
                {company.contact_person_1 || 'Not set'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <HiMapPin className="text-slate-400" />
                Suite 1, Launchpad Coworking
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Total Deliveries</p>
              <p className="text-4xl font-black leading-none">{resolveDeliveryCount(company)}</p>
            </div>
          </div>
        </article>
      ) : null}
    </section>
  )
}
