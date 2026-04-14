import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AdminPageHeader from '../components/AdminPageHeader'
import useDebounce from '../hooks/useDebounce'
import CompaniesDataTable from '../components/companies/CompaniesDataTable'
import CompaniesTablePagination from '../components/companies/CompaniesTablePagination'
import CompaniesTableToolbar from '../components/companies/CompaniesTableToolbar'
import CompaniesTableSkeleton from '../components/companies/CompaniesTableSkeleton'
import { getCompanies } from '../../../services/companyAPIServices'

function normalizeCompanies(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function normalizeCompanyType(packageTier = '') {
  const normalized = packageTier.toLowerCase().trim()
  if (!normalized) return 'Business Package'
  if (normalized.includes('virtual office')) return 'Virtual Office'
  if (normalized.includes('use of address')) return 'Address Service'
  if (normalized.includes('cowork')) return 'Coworking Membership'
  if (normalized.includes('dedicated')) return 'Dedicated Office'
  return packageTier
}

function normalizeStatus(company) {
  const status = company?.contract_status || company?.status || (company?.is_active ? 'active' : 'inactive')
  return String(status).toLowerCase()
}

function normalizeDeliveryCount(company) {
  if (typeof company?.delivery_count === 'number') return company.delivery_count
  if (typeof company?.deliveryCount === 'number') return company.deliveryCount
  return 0
}

function sortCompanies(companies, sortBy, sortDirection) {
  const sorted = [...companies].sort((left, right) => {
    const leftValue = left?.[sortBy]
    const rightValue = right?.[sortBy]

    if (sortBy === 'delivery_count') {
      const numericLeft = normalizeDeliveryCount(left)
      const numericRight = normalizeDeliveryCount(right)
      return numericLeft - numericRight
    }

    const textLeft = String(leftValue || '').toLowerCase()
    const textRight = String(rightValue || '').toLowerCase()
    return textLeft.localeCompare(textRight)
  })

  return sortDirection === 'asc' ? sorted : sorted.reverse()
}

export default function AdminCompanies() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState('company_name')
  const [sortDirection, setSortDirection] = useState('asc')

  const debouncedSearch = useDebounce(search, 250)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['companies-dashboard'],
    queryFn: getCompanies,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typeFilter, statusFilter, pageSize])

  const companies = useMemo(() => {
    return normalizeCompanies(data).map((company) => ({
      ...company,
      package_tier: normalizeCompanyType(company.package_tier),
      status: normalizeStatus(company),
      delivery_count: normalizeDeliveryCount(company),
    }))
  }, [data])

  const packageTypeOptions = useMemo(
    () => [...new Set(companies.map((company) => company.package_tier).filter(Boolean))],
    [companies]
  )

  const filteredCompanies = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()

    return companies.filter((company) => {
      const matchesSearch =
        !keyword ||
        [company.company_name, company.email_1, company.address, company.location]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(keyword))

      const matchesType = !typeFilter || company.package_tier === typeFilter
      const matchesStatus = !statusFilter || company.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [companies, debouncedSearch, typeFilter, statusFilter])

  const sortedCompanies = useMemo(
    () => sortCompanies(filteredCompanies, sortBy, sortDirection),
    [filteredCompanies, sortBy, sortDirection]
  )

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedCompanies.slice(start, start + pageSize)
  }, [sortedCompanies, page, pageSize])

  const totalItems = sortedCompanies.length

  function handleSort(columnKey) {
    if (sortBy === columnKey) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(columnKey)
    setSortDirection('asc')
  }

  function renderEmptyState(title, subtitle) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-700">
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    )
  }

  return (
    <section className="space-y-4 rounded-2xl p-4 md:p-5">
      <AdminPageHeader
        title="Companies"
        subtitle="Manage companies with live search, filters, sorting, and pagination"
      />

      <div className="admin-panel overflow-hidden rounded-2xl bg-white">
        <CompaniesTableToolbar
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeOptions={packageTypeOptions}
        />

        <p
          className="border-y border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
          aria-live="polite"
        >
          {totalItems} result{totalItems === 1 ? '' : 's'} found
          {debouncedSearch ? ` for "${debouncedSearch}"` : ''}
        </p>

        {isError ? (
          <div className="mx-4 my-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            Unable to load companies right now. Please try again.
          </div>
        ) : null}

        {isLoading ? <CompaniesTableSkeleton /> : null}

        {!isLoading && paginatedCompanies.length > 0 ? (
          <>
            <CompaniesDataTable
              rows={paginatedCompanies}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              onOpenCompany={(company) => navigate(`/admin/companies/${company.id}`)}
              startIndex={(page - 1) * pageSize}
            />

            <CompaniesTablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : null}

        {!isLoading && !isError && companies.length === 0 ? (
          <div className="p-4">{renderEmptyState('No companies found', 'No company records are available yet.')}</div>
        ) : null}

        {!isLoading && !isError && companies.length > 0 && filteredCompanies.length === 0 ? (
          <div className="p-4">{renderEmptyState('No matching companies', 'Try adjusting your search or filter selections.')}</div>
        ) : null}

      </div>
    </section>
  )
}
