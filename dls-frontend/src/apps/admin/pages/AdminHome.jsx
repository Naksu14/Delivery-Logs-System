import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { HiArrowDownTray, HiBuildingOffice2, HiCalendarDays, HiClipboardDocumentList, HiMagnifyingGlass } from 'react-icons/hi2'
import AdminPageHeader from '../components/AdminPageHeader'
import { getDeliveryLogs } from '../../../services/deliveriesServices'
import { getCompanies } from '../../../services/companyAPIServices'
import './admin-home.css'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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
  const [analyticsRange, setAnalyticsRange] = useState('week')

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
    const startOfWeek = getWeekStart(now)
    const startOfNextWeek = new Date(startOfWeek)
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const monthWeeks = Math.max(4, Math.ceil(monthEnd.getDate() / 7))

    const series =
      analyticsRange === 'week'
        ? WEEK_DAYS.map((label) => ({ label, parcel: 0, mail: 0, others: 0 }))
        : analyticsRange === 'month'
          ? Array.from({ length: monthWeeks }, (_, index) => ({ label: `W${index + 1}`, parcel: 0, mail: 0, others: 0 }))
          : MONTH_LABELS.map((label) => ({ label, parcel: 0, mail: 0, others: 0 }))

    deliveries.forEach((item) => {
      const date = new Date(item?.date_received)
      if (Number.isNaN(date.getTime())) return

      let bucketIndex = -1

      if (analyticsRange === 'week') {
        if (date < startOfWeek || date >= startOfNextWeek) return
        const dayIndex = date.getDay()
        bucketIndex = dayIndex === 0 ? 6 : dayIndex - 1
      } else if (analyticsRange === 'month') {
        if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return
        bucketIndex = Math.floor((date.getDate() - 1) / 7)
      } else {
        if (date.getFullYear() !== now.getFullYear()) return
        bucketIndex = date.getMonth()
      }

      if (bucketIndex < 0 || !series[bucketIndex]) return

      const type = normalizeType(item?.delivery_type)
      if (typeof typeTotals[type] === 'number') {
        typeTotals[type] += 1
        series[bucketIndex][type] += 1
      }
    })

    const maxValue = Math.max(
      1,
      ...series.map((item) => Math.max(item.parcel, item.mail, item.others))
    )

    return { series, typeTotals, maxValue }
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
          <div className="admin-home-panel-head">
            <h3>Delivery Analytics</h3>
          </div>
          <div className="admin-home-panel-controls">
            <div className="admin-home-chart-legend">
              <span className="legend-item"><i className="legend-dot is-parcel" /> Parcel</span>
              <span className="legend-item"><i className="legend-dot is-mail" /> Mails</span>
              <span className="legend-item"><i className="legend-dot is-others" /> Others</span>
            </div>
            <select
              className="admin-home-filter-select"
              value={analyticsRange}
              onChange={(event) => setAnalyticsRange(event.target.value)}
              aria-label="Filter analytics by period"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          <div className="admin-home-rechart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.series} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
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
