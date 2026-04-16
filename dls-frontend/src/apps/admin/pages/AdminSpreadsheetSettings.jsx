import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineCog6Tooth, HiOutlineLink, HiOutlineBuildingOffice2, HiOutlineTrash, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2'
import AdminPageHeader from '../components/AdminPageHeader'
import CompanySearchSelect from '../components/CompanySearchSelect'
import { getCompanies } from '../../../services/companyAPIServices'
import {
  getDeliverySpreadsheetSettings,
  updateDeliverySpreadsheetSettings,
  upsertCompanyDeliverySpreadsheetMapping,
  deleteCompanyDeliverySpreadsheetMapping,
} from '../../../services/deliveriesServices'

function toCompanies(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function extractApiMessage(error, fallback) {
  const message = error?.response?.data?.message
  if (Array.isArray(message) && message.length > 0) {
    return String(message[0])
  }

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return fallback
}

export default function AdminSpreadsheetSettings() {
  const queryClient = useQueryClient()
  const [globalSpreadsheet, setGlobalSpreadsheet] = useState('')
  const [fallbackToGlobal, setFallbackToGlobal] = useState(true)
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [companySpreadsheet, setCompanySpreadsheet] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const { data: settings, isLoading: isSettingsLoading, isError: isSettingsError } = useQuery({
    queryKey: ['delivery-spreadsheet-settings'],
    queryFn: getDeliverySpreadsheetSettings,
    onSuccess: (payload) => {
      setGlobalSpreadsheet(payload?.global_spreadsheet_url || '')
      setFallbackToGlobal(Boolean(payload?.fallback_to_global))
    },
  })

  const { data: companiesPayload } = useQuery({
    queryKey: ['companies-dashboard'],
    queryFn: getCompanies,
  })

  const companies = useMemo(() => toCompanies(companiesPayload), [companiesPayload])
  const mappings = useMemo(() => (Array.isArray(settings?.company_mappings) ? settings.company_mappings : []), [settings])

  const updateGlobalMutation = useMutation({
    mutationFn: updateDeliverySpreadsheetSettings,
    onSuccess: () => {
      setSaveMessage('Global spreadsheet settings saved successfully.')
      setSaveError('')
      queryClient.invalidateQueries({ queryKey: ['delivery-spreadsheet-settings'] })
    },
    onError: (error) => {
      setSaveError(extractApiMessage(error, 'Unable to save global spreadsheet settings.'))
      setSaveMessage('')
    },
  })

  const upsertMappingMutation = useMutation({
    mutationFn: upsertCompanyDeliverySpreadsheetMapping,
    onSuccess: () => {
      setSaveMessage('Company spreadsheet mapping saved successfully.')
      setSaveError('')
      setSelectedCompanyId('')
      setCompanySpreadsheet('')
      queryClient.invalidateQueries({ queryKey: ['delivery-spreadsheet-settings'] })
    },
    onError: (error) => {
      setSaveError(extractApiMessage(error, 'Unable to save company spreadsheet mapping.'))
      setSaveMessage('')
    },
  })

  const deleteMappingMutation = useMutation({
    mutationFn: deleteCompanyDeliverySpreadsheetMapping,
    onSuccess: () => {
      setSaveMessage('Company spreadsheet mapping removed successfully.')
      setSaveError('')
      queryClient.invalidateQueries({ queryKey: ['delivery-spreadsheet-settings'] })
    },
    onError: (error) => {
      setSaveError(extractApiMessage(error, 'Unable to remove company spreadsheet mapping.'))
      setSaveMessage('')
    },
  })

  const isBusy =
    updateGlobalMutation.isPending || upsertMappingMutation.isPending || deleteMappingMutation.isPending

  const saveGlobalSettings = () => {
    setSaveMessage('')
    setSaveError('')

    updateGlobalMutation.mutate({
      global_spreadsheet: globalSpreadsheet,
      fallback_to_global: fallbackToGlobal,
    })
  }

  const saveCompanyMapping = () => {
    setSaveMessage('')
    setSaveError('')

    const company = companies.find((entry) => String(entry?.id) === String(selectedCompanyId))
    if (!company) {
      setSaveError('Please select a company before saving the mapping.')
      return
    }

    if (!companySpreadsheet.trim()) {
      setSaveError('Please provide a company spreadsheet URL or spreadsheet ID.')
      return
    }

    upsertMappingMutation.mutate({
      company_id: Number(company.id),
      company_name: company.company_name,
      spreadsheet: companySpreadsheet.trim(),
    })
  }

  return (
    <section className="space-y-4">
      <AdminPageHeader
        title="Spreadsheet Settings"
        subtitle="Configure global and per-company Google Sheets delivery logging."
      />

      {isSettingsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load spreadsheet settings. Please refresh.
        </div>
      ) : null}

      {saveMessage ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      ) : null}

      <article className="admin-card space-y-5">
        <div className="flex items-center gap-2">
          <HiOutlineCog6Tooth className="text-lg text-slate-700" />
          <h3 className="text-lg font-extrabold text-slate-900">Global Spreadsheet</h3>
        </div>

        {settings?.global_spreadsheet_url && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Current Global Spreadsheet</p>
            <div className="flex items-center justify-between gap-3">
              <a
                href={settings.global_spreadsheet_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-sm text-slate-700 underline decoration-dotted underline-offset-4 break-all"
              >
                {settings.global_spreadsheet_url}
              </a>
              <button
                type="button"
                className="admin-btn-secondary whitespace-nowrap"
                onClick={() => window.open(settings.global_spreadsheet_url, '_blank')}
                disabled={isBusy}
                aria-label="View current global spreadsheet in new tab"
              >
                <HiOutlineArrowTopRightOnSquare />
                View
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="globalSpreadsheet">
            Global spreadsheet URL or ID
          </label>
          <input
            id="globalSpreadsheet"
            className="admin-input-control"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={globalSpreadsheet}
            onChange={(event) => setGlobalSpreadsheet(event.target.value)}
            disabled={isBusy || isSettingsLoading}
          />
          <p className="text-xs text-slate-500">
            Used for all delivery logs when no company-specific spreadsheet is configured.
          </p>
        </div>

        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={fallbackToGlobal}
              onChange={(event) => setFallbackToGlobal(event.target.checked)}
              disabled={isBusy || isSettingsLoading}
            />
            Enable fallback to global sheet
          </label>
          <p className="text-xs text-red-500 ml-6">
            When enabled, deliveries for companies without a specific spreadsheet will be saved to the global spreadsheet. When disabled, these deliveries won't be saved to any spreadsheet.
          </p>
        </div>

        <div>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={saveGlobalSettings}
            disabled={isBusy || isSettingsLoading || !globalSpreadsheet.trim()}
          >
            <HiOutlineLink />
            Save Global Settings
          </button>
        </div>
      </article>

      <article className="admin-card space-y-5">
        <div className="flex items-center gap-2">
          <HiOutlineBuildingOffice2 className="text-lg text-slate-700" />
          <h3 className="text-lg font-extrabold text-slate-900">Company-Specific Spreadsheet</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="companySelect">
              Company
            </label>
            <CompanySearchSelect
              id="companySelect"
              companies={companies}
              valueId={selectedCompanyId}
              onChange={setSelectedCompanyId}
              loading={isSettingsLoading}
              disabled={isBusy || isSettingsLoading}
              placeholder="Select company"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="companySpreadsheet">
              Company spreadsheet URL or ID
            </label>
            <input
              id="companySpreadsheet"
              className="admin-input-control"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={companySpreadsheet}
              onChange={(event) => setCompanySpreadsheet(event.target.value)}
              disabled={isBusy || isSettingsLoading}
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={saveCompanyMapping}
            disabled={isBusy || isSettingsLoading || !selectedCompanyId || !companySpreadsheet.trim()}
          >
            <HiOutlineLink />
            Save Company Mapping
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Spreadsheet</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={3}>
                    No company-specific spreadsheet mappings yet.
                  </td>
                </tr>
              ) : (
                mappings.map((mapping) => (
                  <tr key={mapping.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-800">{mapping.company_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <a
                        href={mapping.spreadsheet_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-700 underline decoration-dotted underline-offset-4"
                      >
                        {mapping.spreadsheet_id}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => window.open(mapping.spreadsheet_url, '_blank')}
                          disabled={isBusy}
                          aria-label={`View spreadsheet for ${mapping.company_name}`}
                        >
                          <HiOutlineArrowTopRightOnSquare />
                          View
                        </button>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => deleteMappingMutation.mutate(mapping.id)}
                          disabled={isBusy}
                          aria-label={`Remove mapping for ${mapping.company_name}`}
                        >
                          <HiOutlineTrash />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}