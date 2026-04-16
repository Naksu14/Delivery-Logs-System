import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { HiArrowDownTray, HiBuildingOffice2, HiCalendarDays, HiClipboardDocumentList, HiMagnifyingGlass } from 'react-icons/hi2'
import AdminPageHeader from '../components/AdminPageHeader'
import { getDeliveryLogs } from '../../../services/deliveriesServices'
import { getCompanies } from '../../../services/companyAPIServices'
import './admin-home.css'

const ANALYTICS_RANGES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]
const CHART_COLORS = {
  parcel: '#a3d977',
  mail: '#4baa2d',
  others: '#d4df45',
}

function normalizeType(type = '') {
  const value = String(type).toLowerCase()
  if (value.includes('parcel')) return 'parcel'
  if (value.includes('mail')) return 'mail'
  return 'others'
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getWeekStart(date) {
  const base = new Date(date)
  const day = base.getDay() || 7
  base.setDate(base.getDate() - day + 1)
  base.setHours(0, 0, 0, 0)
  return base
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-CA', {
    day: '2-digit',
    month: 'short',
  })
}

function formatDayLabel(date) {
  return date.toLocaleDateString('en-CA', {
    day: '2-digit',
    month: 'short',
  })
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('en-CA', {
    month: 'short',
    year: 'numeric',
  })
}

function clampName(value = '', max = 28) {
  if (!value) return '—'
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}...`
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n')
}

function StatusBadge({ status }) {
  const normalized = String(status || 'Pending').toLowerCase()
  const isReleased = normalized === 'released'
  return (
    <span className={`admin-home-status ${isReleased ? 'is-released' : 'is-pending'}`}>
      {isReleased ? 'Released' : 'Pending'}
    </span>
  )
}

export default function AdminHome() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [analyticsRange, setAnalyticsRange] = useState('daily')

  const {
    data: deliveryData,
    isLoading: isDeliveryLoading,
    isError: isDeliveryError,
  } = useQuery({
    queryKey: ['dashboard-deliveries'],
    queryFn: () => getDeliveryLogs({ page: 1, limit: 250 }),
  })

  const {
    data: companiesData,
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
  } = useQuery({
    queryKey: ['dashboard-companies'],
    queryFn: getCompanies,
  })

  const deliveries = useMemo(() => {
    if (Array.isArray(deliveryData?.items)) return deliveryData.items
    if (Array.isArray(deliveryData)) return deliveryData
    return []
  }, [deliveryData])

  const companies = useMemo(() => {
    if (Array.isArray(companiesData)) return companiesData
    if (Array.isArray(companiesData?.items)) return companiesData.items
    return []
  }, [companiesData])

  const now = new Date()
  const weekStart = getWeekStart(now)

  const kpis = useMemo(() => {
    const todayCount = deliveries.filter((item) => isSameDay(new Date(item?.date_received), now)).length
    const thisWeekCount = deliveries.filter((item) => {
      const date = new Date(item?.date_received)
      if (Number.isNaN(date.getTime())) return false
      return date >= weekStart
    }).length

    return {
      totalDeliveries: Number(deliveryData?.meta?.totalItems || deliveries.length),
      todayCount,
      totalCompanies: companies.length,
      thisWeekCount,
    }
  }, [companies.length, deliveries, deliveryData?.meta?.totalItems, now, weekStart])

  const chartData = useMemo(() => {
    const typeTotals = { parcel: 0, mail: 0, others: 0 }
    const deliveryDates = deliveries
      .map((item) => new Date(item?.date_received))
      .filter((date) => !Number.isNaN(date.getTime()))

    if (deliveryDates.length === 0) {
      return { series: [], typeTotals, label: 'No delivery data available' }
    }

    const earliestDate = new Date(Math.min(...deliveryDates.map((date) => date.getTime())))
    const latestDate = new Date(Math.max(...deliveryDates.map((date) => date.getTime())))

    const series =
      analyticsRange === 'daily'
        ? (() => {
            const startDate = new Date(earliestDate)
            const endDate = new Date(latestDate)
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(0, 0, 0, 0)
            const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
            return Array.from({ length: dayCount }, (_, index) => ({
              label: formatDayLabel(addDays(startDate, index)),
              parcel: 0,
              mail: 0,
              others: 0,
            }))
          })()
        : analyticsRange === 'weekly'
          ? (() => {
              const startWeek = getWeekStart(earliestDate)
              const endWeek = getWeekStart(latestDate)
              const weekCount = Math.floor((endWeek.getTime() - startWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
              return Array.from({ length: weekCount }, (_, index) => {
                const weekStart = addDays(startWeek, index * 7)
                const weekEnd = addDays(weekStart, 6)
                return {
                  label: `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
                  parcel: 0,
                  mail: 0,
                  others: 0,
                }
              })
            })()
          : (() => {
              const startMonth = getMonthStart(earliestDate)
              const endMonth = getMonthStart(latestDate)
              const monthCount = (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1
              return Array.from({ length: monthCount }, (_, index) => {
                const monthDate = addMonths(startMonth, index)
                return {
                  label: formatMonthLabel(monthDate),
                  parcel: 0,
                  mail: 0,
                  others: 0,
                }
              })
            })()

    deliveries.forEach((item) => {
      const date = new Date(item?.date_received)
      if (Number.isNaN(date.getTime())) return

      let bucketIndex = -1

      if (analyticsRange === 'daily') {
        const startDate = new Date(earliestDate)
        startDate.setHours(0, 0, 0, 0)
        const currentDate = new Date(date)
        currentDate.setHours(0, 0, 0, 0)
        bucketIndex = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      } else if (analyticsRange === 'weekly') {
        const startWeek = getWeekStart(earliestDate)
        const dateWeekStart = getWeekStart(date)
        bucketIndex = Math.floor((dateWeekStart.getTime() - startWeek.getTime()) / (7 * 24 * 60 * 60 * 1000))
        if (bucketIndex < 0 || bucketIndex >= series.length) return
      } else {
        const startMonth = getMonthStart(earliestDate)
        bucketIndex = (date.getFullYear() - startMonth.getFullYear()) * 12 + (date.getMonth() - startMonth.getMonth())
        if (bucketIndex < 0 || bucketIndex >= series.length) return
      }

      if (bucketIndex < 0 || !series[bucketIndex]) return

      const type = normalizeType(item?.delivery_type)
      if (typeof typeTotals[type] === 'number') {
        typeTotals[type] += 1
        series[bucketIndex][type] += 1
      }
    })

    const label =
      analyticsRange === 'daily'
        ? `${formatDayLabel(earliestDate)} to ${formatDayLabel(latestDate)}`
        : analyticsRange === 'weekly'
          ? `${formatShortDate(getWeekStart(earliestDate))} to ${formatShortDate(addDays(getWeekStart(latestDate), 6))}`
          : `${formatMonthLabel(getMonthStart(earliestDate))} to ${formatMonthLabel(getMonthStart(latestDate))}`

    return { series, typeTotals, label }
  }, [analyticsRange, deliveries, now])

  const recentDeliveries = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const filtered = deliveries
      .filter((item) => {
        if (!keyword) return true
        const haystack = [
          item?.company_name,
          item?.delivery_type,
          item?.delivery_partner,
          item?.courier_type_name,
          item?.deliverer_name,
          item?.description,
          item?.received_by,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(keyword)
      })
      .sort((a, b) => new Date(b?.date_received || 0) - new Date(a?.date_received || 0))

    return filtered.slice(0, 10)
  }, [deliveries, search])

  const activeCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => (Number(b?.delivery_count || 0) - Number(a?.delivery_count || 0)))
      .slice(0, 8)
  }, [companies])

  const donutStyle = useMemo(() => {
    const { parcel, mail, others } = chartData.typeTotals
    const total = parcel + mail + others
    if (!total) {
      return {
        background: 'conic-gradient(#d5d9d1 0deg 360deg)'
      }
    }

    const parcelDeg = (parcel / total) * 360
    const mailDeg = (mail / total) * 360
    const othersDeg = 360 - parcelDeg - mailDeg

    return {
      background: `conic-gradient(${CHART_COLORS.parcel} 0deg ${parcelDeg}deg, ${CHART_COLORS.mail} ${parcelDeg}deg ${parcelDeg + mailDeg}deg, ${CHART_COLORS.others} ${parcelDeg + mailDeg}deg ${parcelDeg + mailDeg + othersDeg}deg)`
    }
  }, [chartData.typeTotals])

  const exportCsv = () => {
    const rows = [
      ['Date & Time', 'Company', 'Delivery Type', 'Deliverer', 'Courier/Supplier', 'Description', 'Received By', 'Status'],
      ...recentDeliveries.map((item) => [
        formatDateTime(item?.date_received),
        item?.company_name || '—',
        item?.delivery_type || '—',
        item?.deliverer_name || '—',
        item?.courier_type_name || item?.delivery_partner || '—',
        item?.description || '—',
        item?.received_by || '—',
        item?.is_status || 'Pending',
      ])
    ]

    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `delivery-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-4">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Monitor and manage all delivery records in one place."
        actions={(
          <div className="admin-home-actions">
            <button type="button" className="admin-btn-primary" onClick={() => navigate('/admin/new-delivery')}>
              <HiClipboardDocumentList />
              Create Log
            </button>
            <button type="button" className="admin-btn-secondary" onClick={exportCsv}>
              <HiArrowDownTray />
              Export
            </button>
          </div>
        )}
      />

      {(isDeliveryError || isCompaniesError) ? (
        <div className="admin-home-alert">
          Unable to load dashboard metrics. Please refresh the page.
        </div>
      ) : null}

      <div className="admin-home-kpi-grid">
        <article className="admin-home-kpi-card is-primary">
          <div className="admin-home-kpi-head">
            <p>Total Deliveries</p>
            <span className="admin-kpi-icon"><HiClipboardDocumentList /></span>
          </div>
          <h3>{isDeliveryLoading ? '...' : kpis.totalDeliveries}</h3>
          <p className="admin-kpi-note">{!isDeliveryLoading ? 'Increased from last week' : ''}</p>
        </article>

        <article className="admin-home-kpi-card">
          <div className="admin-home-kpi-head">
            <p>Today's Deliveries</p>
            <span className="admin-kpi-icon"><HiCalendarDays /></span>
          </div>
          <h3>{isDeliveryLoading ? '...' : kpis.todayCount}</h3>
          <p className="admin-kpi-note">{!isDeliveryLoading ? `${chartData.typeTotals.parcel} parcels • ${chartData.typeTotals.mail} mails • ${chartData.typeTotals.others} others` : ''}</p>
        </article>

        <article className="admin-home-kpi-card">
          <div className="admin-home-kpi-head">
            <p>Total Companies</p>
            <span className="admin-kpi-icon"><HiBuildingOffice2 /></span>
          </div>
          <h3>{isCompaniesLoading ? '...' : kpis.totalCompanies}</h3>
          <p className="admin-kpi-note">{!isCompaniesLoading ? `${kpis.totalCompanies} Active companies` : ''}</p>
        </article>

        <article className="admin-home-kpi-card">
          <div className="admin-home-kpi-head">
            <p>This Week</p>
            <span className="admin-kpi-icon"><HiClipboardDocumentList /></span>
          </div>
          <h3>{isDeliveryLoading ? '...' : kpis.thisWeekCount}</h3>
          <p className="admin-kpi-note">{!isDeliveryLoading ? `${kpis.thisWeekCount} Increased from last week` : ''}</p>
        </article>
      </div>

      <div className="admin-home-analytics-grid">
        <article className="admin-home-panel">
          <div className="admin-home-panel-head admin-home-panel-head--chart">
            <h3>Delivery Analytics</h3>
            <div className="admin-home-range-tabs" role="tablist" aria-label="Select analytics period">
              {ANALYTICS_RANGES.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  className={`admin-home-range-tab ${analyticsRange === range.value ? 'is-active' : ''}`}
                  aria-pressed={analyticsRange === range.value}
                  onClick={() => setAnalyticsRange(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-home-panel-controls">
            <div className="admin-home-chart-legend">
              <span className="legend-item"><i className="legend-dot is-parcel" /> Parcel</span>
              <span className="legend-item"><i className="legend-dot is-mail" /> Mails</span>
              <span className="legend-item"><i className="legend-dot is-others" /> Others</span>
            </div>
            <p className="admin-home-chart-label">{chartData.label}</p>
          </div>

          <div className="admin-home-rechart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.series} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.65)' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', background: '#ffffff' }}
                />
                <Bar dataKey="parcel" name="Parcel" fill={CHART_COLORS.parcel} radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="mail" name="Mails" fill={CHART_COLORS.mail} radius={[6, 6, 0, 0]} maxBarSize={22} />
                <Bar dataKey="others" name="Others" fill={CHART_COLORS.others} radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-home-panel admin-home-donut-panel">
          <div className="admin-home-panel-head">
            <h3>Delivery Types</h3>
          </div>
          <div className="admin-home-donut" style={donutStyle} />
          <ul className="admin-home-legend">
            <li><span className="is-parcel" /> Parcel <strong>{chartData.typeTotals.parcel}</strong></li>
            <li><span className="is-mail" /> Mails <strong>{chartData.typeTotals.mail}</strong></li>
            <li><span className="is-others" /> Others <strong>{chartData.typeTotals.others}</strong></li>
          </ul>
        </article>
      </div>

      <div className="admin-home-bottom-grid">
        <article className="admin-home-panel">
          <div className="admin-home-panel-head is-table-head">
            <h3>Recent Deliveries</h3>
            <label className="admin-home-search">
              <HiMagnifyingGlass />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search records"
              />
            </label>
          </div>

          <div className="admin-home-table-wrap">
            <table className="admin-home-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Company</th>
                  <th>Delivery Type</th>
                  <th>Deliverer</th>
                  <th>Courier/Supplier</th>
                  <th>Description</th>
                  <th>Received by</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-home-empty">No delivery records found.</td>
                  </tr>
                ) : (
                  recentDeliveries.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDateTime(item?.date_received)}</td>
                      <td>{clampName(item?.company_name, 24)}</td>
                      <td>{item?.delivery_type || '—'}</td>
                      <td>{clampName(item?.deliverer_name, 20)}</td>
                      <td>{clampName(item?.courier_type_name || item?.delivery_partner, 18)}</td>
                      <td>{clampName(item?.description, 24)}</td>
                      <td>{clampName(item?.received_by, 18)}</td>
                      <td><StatusBadge status={item?.is_status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-home-panel admin-home-companies-panel">
          <div className="admin-home-panel-head">
            <h3>Companies</h3>
          </div>
          <ul className="admin-home-company-list">
            {activeCompanies.length === 0 ? (
              <li className="admin-home-empty">No companies found.</li>
            ) : (
              activeCompanies.map((company) => (
                <li key={company.id}>
                  <div className="admin-home-company-icon"><HiBuildingOffice2 /></div>
                  <div>
                    <p>{company.company_name}</p>
                    <small>{company.delivery_count || 0} deliveries</small>
                  </div>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  )
}
