import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AdminPageHeader from '../components/AdminPageHeader'
import CompanyCard from '../components/companies/CompanyCard'
import CompaniesPageSkeleton from '../components/companies/CompaniesPageSkeleton'
import CompanySearchBar from '../components/companies/CompanySearchBar'
import { getCompanies } from '../../../services/companyAPIServices'

function normalizeCompanies(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

export default function AdminCompanies() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['companies-dashboard'],
    queryFn: getCompanies,
  })

  const companies = useMemo(() => normalizeCompanies(data), [data])

  const filteredCompanies = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return companies

    return companies.filter((company) =>
      (company.company_name || '').toLowerCase().includes(keyword)
    )
  }, [companies, search])

  return (
    <section className="space-y-4">
      <AdminPageHeader
        title="Companies"
        subtitle="Manage Companies and view delivery statistics"
        actions={<CompanySearchBar value={search} onChange={setSearch} />}
      />

      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load companies right now. Please try again.
        </div>
      ) : null}

      {isLoading ? <CompaniesPageSkeleton /> : null}

      {!isLoading && filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={(selectedCompany) => navigate(`/admin/companies/${selectedCompany.id}`)}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-slate-700">No companies found</p>
          <p className="mt-1 text-sm text-slate-500">The company table has no records yet.</p>
        </div>
      ) : null}

      {!isLoading && !isError && companies.length > 0 && filteredCompanies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-slate-700">No companies found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different company name in search.
          </p>
        </div>
      ) : null}
    </section>
  )
}
