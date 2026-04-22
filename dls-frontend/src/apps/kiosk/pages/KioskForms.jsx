import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormControl,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import { FaBoxOpen, FaBuilding, FaRegFileAlt, FaTrashAlt, FaTruck, FaUser } from 'react-icons/fa'
import { IoArrowBack } from 'react-icons/io5'

import { getCompanies } from '../../../services/companyAPIServices'
import { getDeliveryPartners } from '../../../services/deliveryPartnersServices'
import { getDeliveryTypes } from '../../../services/deliveryTypeServices'
import { createDeliveryLog } from '../../../services/deliveriesServices'
import DeliverySummaryModal from '../components/DeliverySummaryModal'
import KioskBlobsBackground from '../components/KioskBlobsBackground'

// ============================================================================
// Colors & Design Tokens
// ============================================================================

const COLORS = {
  backgroundColor: '#ffffff',
  card: '#f9f9f9',
  border: '#e0e0e0',
  divider: '#dde847',
  inputBorder: '#cccccc',
  inputFocusBorder: '#dde847',
  inputText: '#000000',
  primaryBrown: '#000000',
  secondaryBrown: '#333333',
  darkBrown: '#1a1a1a',
  textMuted: '#666666',
  accentBrown: '#dde847',
  labelBrown: '#000000',
  successGreen: '#dde847'
}

// ============================================================================
// Form Configuration
// ============================================================================

const initialForm = {
  deliveryFor: 'Company',
  companyId: '',
  companyNameManual: '',
  recipientName: '',
  deliveryItems: [],
  deliveryByType: '',
  deliveryPartner: '',
  courierTypeName: '',
  supplierDescription: '',
  delivererName: '',
  description: '',
  is_status: 'Pending'
}

const defaultDeliveryPartnerOptions = []
const defaultDeliveryByTypeOptions = ['Courier', 'Supplier']
const defaultDeliveryTypeOptions = ['Parcel', 'Mail', 'Other']
const companySelectPlaceholder = 'Select company'

function createDeliveryItem(name = '', quantity = 1) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    customName: '',
    quantity,
  }
}

function normalizeQuantity(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 1
  return Math.floor(parsed)
}

function formatDeliveryItemsSummary(items = []) {
  if (!Array.isArray(items) || items.length === 0) return ''
  return items
    .map((item) => ({
      name: resolveDeliveryItemName(item),
      quantity: normalizeQuantity(item?.quantity),
    }))
    .filter((item) => item.name)
    .map((item) => `${item.name} (${item.quantity})`)
    .join(', ')
}

function isOtherDeliveryType(name) {
  return String(name || '').trim().toLowerCase() === 'other'
}

function resolveDeliveryItemName(item) {
  const selectedName = String(item?.name || '').trim()
  if (!selectedName) return ''
  if (!isOtherDeliveryType(selectedName)) return selectedName
  return String(item?.customName || '').trim()
}

function normalizeDeliveryItemsForPayload(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item?.id,
      name: resolveDeliveryItemName(item),
      quantity: normalizeQuantity(item?.quantity),
    }))
    .filter((item) => item.name)
}

function getCompanyLabel(company) {
  if (!company) return ''
  return company.branch ? `${company.company_name}` : company.company_name
}

function formatTypeLabel(type) {
  if (!type) return ''
  const normalized = String(type).trim().toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function formatNameLabel(name) {
  if (!name) return ''
  const normalized = String(name).trim().toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

// ============================================================================
// Material-UI Sx Properties
// ============================================================================

const baseInputSx = {
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  fontSize: '1rem',
  color: COLORS.inputText,
  fontWeight: 500,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
}

const fieldSx = {
  '& .MuiInputBase-root': {
    height: 56,
    ...baseInputSx
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#e0e0e0',
    borderWidth: '1.5px'
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#dde847',
    borderWidth: '2px'
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: COLORS.inputFocusBorder,
    borderWidth: '2px',
    boxShadow: '0 0 0 3px rgba(221, 232, 71, 0.1)'
  }
}

const textareaSx = {
  '& .MuiInputBase-root': baseInputSx,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#e0e0e0',
    borderWidth: '1.5px'
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#dde847',
    borderWidth: '2px'
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: COLORS.inputFocusBorder,
    borderWidth: '2px',
    boxShadow: '0 0 0 3px rgba(221, 232, 71, 0.1)'
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function prettyDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCurrentDateTime(value = new Date()) {
  return value.toLocaleString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function FieldLabel({ icon: Icon, text, required = false }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, color: COLORS.primaryBrown }}>
      {Icon && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#dde847',
          fontSize: '1.2rem'
        }}>
          <Icon size={18} />
        </Box>
      )}
      <Typography sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.3px' }}>
        {text}
        {required ? <span style={{ color: '#ff4444', marginLeft: '4px' }}>*</span> : null}
      </Typography>
    </Stack>
  )
}

function isRenderableComponent(component) {
  if (typeof component === 'function') return true
  if (typeof component === 'object' && component !== null && component.$$typeof) return true
  return false
}

// ============================================================================
// Main Component
// ============================================================================


export default function KioskForms() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(initialForm)
  const [currentNow, setCurrentNow] = useState(() => new Date())
  const [showSummary, setShowSummary] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const canRenderBlobs = isRenderableComponent(KioskBlobsBackground)
  const canRenderSummaryModal = isRenderableComponent(DeliverySummaryModal)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const currentDateReceived = useMemo(() => getLocalDateString(currentNow), [currentNow])
  const currentDateTimeLabel = useMemo(() => formatCurrentDateTime(currentNow), [currentNow])

  const {
    data: companies = [],
    isLoading: isCompaniesLoading,
    isError: isCompaniesError
  } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    select: (data) => (Array.isArray(data) ? data : [])
  })

  const {
    data: deliveryPartners = [],
    isLoading: isDeliveryPartnersLoading,
    isError: isDeliveryPartnersError
  } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: getDeliveryPartners,
    select: (data) => (Array.isArray(data) ? data : [])
  })

  const {
    data: deliveryTypes = [],
    isLoading: isDeliveryTypesLoading,
    isError: isDeliveryTypesError
  } = useQuery({
    queryKey: ['delivery-types'],
    queryFn: getDeliveryTypes,
    select: (data) => (Array.isArray(data) ? data : [])
  })
  

  const createLogMutation = useMutation({
    mutationFn: createDeliveryLog,
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery-logs'])
      setSubmitted(true)
      setSubmitError('')
      setFormData(initialForm)
      navigate('/kiosk/success');
    },
    onError: (error) => {
      console.error('Error creating delivery log:', error)
      const apiMessage = error?.response?.data?.message
      const fallback = 'Failed to submit delivery log. Please review the fields and try again.'
      setSubmitError(Array.isArray(apiMessage) ? apiMessage[0] : apiMessage || fallback)
    }
  })

  const deliveredByOptions = useMemo(() => {
    const partners = Array.from(
      new Set(
        deliveryPartners
          .filter((partner) => formatTypeLabel(partner?.type) === 'Courier')
          .map((partner) => partner?.name)
          .filter(Boolean)
      )
    )

    return partners.length > 0 ? partners : defaultDeliveryPartnerOptions
  }, [deliveryPartners])

  const deliveryByTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        deliveryPartners
          .map((partner) => formatTypeLabel(partner?.type))
          .filter((type) => type === 'Courier' || type === 'Supplier')
      )
    )

    return types.length > 0 ? types : defaultDeliveryByTypeOptions
  }, [deliveryPartners])

  const deliveryTypeOptions = useMemo(() => {
    const apiTypes = Array.from(
      new Set(
        deliveryTypes
          .map((deliveryType) => formatNameLabel(deliveryType?.name))
          .filter(Boolean)
          .filter((type) => !isOtherDeliveryType(type))
      )
    )

    const base = apiTypes.length > 0 ? apiTypes : defaultDeliveryTypeOptions.filter((type) => !isOtherDeliveryType(type))
    return [...base, 'Other']
  }, [deliveryTypes])

  const totalItems = useMemo(
    () => normalizeDeliveryItemsForPayload(formData.deliveryItems).reduce((sum, item) => sum + item.quantity, 0),
    [formData.deliveryItems]
  )

  const hasFormChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialForm)
  }, [formData])

  const summaryData = useMemo(() => {
    const isCompanyDelivery = formData.deliveryFor === 'Company'
    const selectedCompany = companies.find((company) => String(company?.id) === String(formData.companyId))
    const companyDisplayName =
      isCompanyDelivery && formData.companyId === 'Not Listed'
        ? formData.companyNameManual
        : isCompanyDelivery && selectedCompany
          ? getCompanyLabel(selectedCompany)
          : ''

    return {
      ...formData,
      deliveryItemsSummary: formatDeliveryItemsSummary(formData.deliveryItems),
      totalItems,
      companyDisplayName,
      dateReceivedPretty: prettyDate(currentDateReceived)
    }
  }, [formData, companies, currentDateReceived, totalItems])

  const addDeliveryItem = () => {
    setSubmitted(false)
    setSubmitError('')
    setFormData((prev) => ({
      ...prev,
      deliveryItems: [...(Array.isArray(prev.deliveryItems) ? prev.deliveryItems : []), createDeliveryItem('', 1)],
    }))
  }

  const updateDeliveryItem = (itemId, field, value) => {
    setSubmitted(false)
    setSubmitError('')
    setFormData((prev) => ({
      ...prev,
      deliveryItems: (Array.isArray(prev.deliveryItems) ? prev.deliveryItems : []).map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: field === 'quantity' ? normalizeQuantity(value) : value,
              ...(field === 'name' && !isOtherDeliveryType(value) ? { customName: '' } : {}),
            }
          : item
      ),
    }))
  }

  const adjustDeliveryItemQuantity = (itemId, delta) => {
    setSubmitted(false)
    setSubmitError('')
    setFormData((prev) => ({
      ...prev,
      deliveryItems: (Array.isArray(prev.deliveryItems) ? prev.deliveryItems : []).map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          quantity: Math.max(1, normalizeQuantity(item.quantity) + delta),
        }
      }),
    }))
  }

  const removeDeliveryItem = (itemId) => {
    setSubmitted(false)
    setSubmitError('')
    setFormData((prev) => ({
      ...prev,
      deliveryItems: (Array.isArray(prev.deliveryItems) ? prev.deliveryItems : []).filter((item) => item.id !== itemId),
    }))
  }

  const onChange = (event) => {
    const { name, value } = event.target
    setSubmitted(false)
    setSubmitError('')

    if (name === 'deliveryFor') {
      setFormData((prev) => ({
        ...prev,
        deliveryFor: value,
        companyId: value === 'Company' ? prev.companyId : '',
        companyNameManual: value === 'Company' ? prev.companyNameManual : ''
      }))
      return
    }

    if (name === 'companyId') {
      setFormData((prev) => ({
        ...prev,
        companyId: value,
        companyNameManual: value === 'Not Listed' ? prev.companyNameManual : ''
      }))
      return
    }

    if (name === 'deliveryPartner') {
      setFormData((prev) => ({
        ...prev,
        deliveryPartner: value,
        courierTypeName: value
      }))
      return
    }

    if (name === 'deliveryByType') {
      setFormData((prev) => ({
        ...prev,
        deliveryByType: value,
        deliveryPartner: '',
        courierTypeName: '',
        supplierDescription: ''
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const openSummary = (event) => {
    event.preventDefault()

    const preparedDeliveryItems = (Array.isArray(formData.deliveryItems) ? formData.deliveryItems : [])
      .map((item) => ({
        id: item?.id,
        name: String(item?.name || '').trim(),
        customName: String(item?.customName || '').trim(),
        quantity: normalizeQuantity(item?.quantity),
      }))

    const hasMissingCustomOther = preparedDeliveryItems.some(
      (item) => isOtherDeliveryType(item.name) && !item.customName
    )

    if (hasMissingCustomOther) {
      setSubmitError('Please provide a custom delivery type for every item set to Other.')
      return
    }

    const normalizedDeliveryItems = normalizeDeliveryItemsForPayload(preparedDeliveryItems)

    if (normalizedDeliveryItems.length === 0) {
      setSubmitError('Please add at least one delivery type item before submitting.')
      return
    }

    setFormData((prev) => ({
      ...prev,
      deliveryItems: preparedDeliveryItems,
    }))

    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }
    setTimeout(() => {
      setShowSummary(true)
    }, 0)
  }

  const submitForm = () => {
    if (createLogMutation.isPending) {
      return
    }

    setShowSummary(false)
    const submittedAt = new Date()

    const selectedCompany = companies.find((company) => company.id === Number(formData.companyId))
    const preparedDeliveryItems = (Array.isArray(formData.deliveryItems) ? formData.deliveryItems : [])
      .map((item) => ({
        id: item?.id,
        name: String(item?.name || '').trim(),
        customName: String(item?.customName || '').trim(),
        quantity: normalizeQuantity(item?.quantity),
      }))

    const hasMissingCustomOther = preparedDeliveryItems.some(
      (item) => isOtherDeliveryType(item.name) && !item.customName
    )

    if (hasMissingCustomOther) {
      setSubmitError('Please provide a custom delivery type for every item set to Other.')
      return
    }

    const normalizedDeliveryItems = normalizeDeliveryItemsForPayload(preparedDeliveryItems).map((item) => ({
      name: item.name,
      quantity: item.quantity,
    }))

    if (normalizedDeliveryItems.length === 0) {
      setSubmitError('Please add at least one delivery type item before submitting.')
      return
    }

    const deliveryTypeSummary = formatDeliveryItemsSummary(normalizedDeliveryItems)
    const totalItemCount = normalizedDeliveryItems.reduce((sum, item) => sum + item.quantity, 0)

    const companyNameValue =
      formData.deliveryFor === 'Individual'
        ? formData.recipientName.trim()
        : formData.companyId === 'Not Listed'
          ? formData.companyNameManual
          : selectedCompany
            ? getCompanyLabel(selectedCompany)
            : ''

    const logData = {
      date_received: submittedAt.toISOString(),
      delivery_for: formData.deliveryFor,
      recipient_name: formData.recipientName,
      company_name: companyNameValue,
      delivery_type: deliveryTypeSummary,
      delivery_items: normalizedDeliveryItems,
      total_items: totalItemCount,
      delivery_partner: formData.deliveryByType === 'Supplier' ? 'Supplier' : formData.deliveryPartner,
      courier_type_name: formData.deliveryByType === 'Courier' ? formData.deliveryPartner : undefined,
      supplier_description: formData.deliveryByType === 'Supplier' ? formData.supplierDescription : undefined,
      deliverer_name: formData.delivererName,
      description: formData.description,
      is_status: formData.is_status,
      received_at: submittedAt.toISOString()
    }

    createLogMutation.mutate(logData)
  }

  return (
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: COLORS.backgroundColor }}>
      {canRenderBlobs ? <KioskBlobsBackground opacity={0.8} /> : null}

      {createLogMutation.isPending ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-black/10 bg-white px-6 py-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <CircularProgress sx={{ color: COLORS.accentBrown }} />
            <div>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: COLORS.primaryBrown }}>
                Saving and sending...
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '0.92rem', color: COLORS.textMuted, fontWeight: 500 }}>
                Please wait while the delivery log is being saved and the email notification is sent.
              </Typography>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 min-h-full px-5 py-6">
        <div className="mb-8 flex items-center gap-4">
          <IconButton
            type="button"
            onClick={() => navigate('/kiosk')}
            size="large"
            aria-label="Back to kiosk home"
            sx={{
              height: 56,
              width: 56,
              backgroundColor: COLORS.accentBrown,
              color: COLORS.primaryBrown,
              boxShadow: '0 4px 12px rgba(221,232,71,0.25)',
              transition: 'all 0.3s ease',
              '&:hover': { 
                backgroundColor: '#cdd341',
                boxShadow: '0 8px 24px rgba(221,232,71,0.35)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <IoArrowBack size={24} />
          </IconButton>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.primaryBrown }}>
            Back
          </Typography>
        </div>

        <div className="mx-auto w-full rounded-[20px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-6 sm:p-8" style={{ border: `1px solid #e8e8e8`, backgroundColor: '#ffffff' }}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: COLORS.primaryBrown, mb: 1 }}>
                Delivery Details
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: COLORS.textMuted, fontWeight: 500 }}>
                Fill in the required information to record this delivery
              </Typography>
            </div>

            <Box
              sx={{
                alignSelf: { xs: 'flex-start', sm: 'flex-end' },
                background: '#f8faf1',
                border: '1px solid #e4eb9f',
                borderRadius: '12px',
                px: 2,
                py: 1,
                textAlign: 'right',
              }}
            >
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Date Received
              </Typography>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827' }}>
                {currentDateTimeLabel}
              </Typography>
            </Box>
          </div>

          <form onSubmit={openSummary} className="space-y-6">
            {/* Receiver Information Section */}
            <Box sx={{ pb: 4, borderBottom: '1px solid #e8e8e8' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <FieldLabel icon={FaBuilding} text="Delivery For" required />
                  <FormControl fullWidth sx={fieldSx}>
                    <Select name="deliveryFor" value={formData.deliveryFor} onChange={onChange} required>
                      <MenuItem value="Company">Company</MenuItem>
                      <MenuItem value="Individual">Individual</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                {formData.deliveryFor === 'Company' ? (
                  <div>
                    <FieldLabel icon={FaBuilding} text="Company" required />
                    {companies.length > 0 || isCompaniesLoading ? (
                      <>
                        <Autocomplete
                          options={[
                            ...companies.map((company) => ({
                              id: String(company.id),
                              label: getCompanyLabel(company),
                              isNotListed: false
                            })),
                            { id: 'Not Listed', label: 'Not Listed', isNotListed: true }
                          ]}
                          value={formData.companyId ? companies.length > 0 ? companies.find((c) => String(c.id) === String(formData.companyId)) ? { id: String(formData.companyId), label: getCompanyLabel(companies.find((c) => String(c.id) === String(formData.companyId))), isNotListed: false } : { id: 'Not Listed', label: 'Not Listed', isNotListed: true } : null : null}
                          onChange={(event, newValue) => {
                            if (newValue) {
                              setFormData((prev) => ({
                                ...prev,
                                companyId: newValue.id,
                                companyNameManual: newValue.isNotListed ? prev.companyNameManual : ''
                              }))
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                companyId: '',
                                companyNameManual: ''
                              }))
                            }
                          }}
                          getOptionLabel={(option) => option?.label || ''}
                          isOptionEqualToValue={(option, value) => option?.id === value?.id}
                          loading={isCompaniesLoading}
                          disabled={isCompaniesLoading}
                          freeSolo={false}
                          disableClearable={false}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder={isCompaniesLoading ? 'Loading companies...' : companySelectPlaceholder}
                              required
                              sx={fieldSx}
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <InputAdornment position="start" sx={{ mr: 1 }}>
                                    <FaBuilding size={18} style={{ color: COLORS.primaryBrown }} />
                                  </InputAdornment>
                                )
                              }}
                            />
                          )}
                        />
                        {isCompaniesError && (
                          <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#b45309' }}>
                            Could not load companies. You can still use Not Listed.
                          </Typography>
                        )}
                      </>
                    ) : (
                      <FormControl fullWidth sx={fieldSx}>
                        <Select
                          name="companyId"
                          value="Not Listed"
                          displayEmpty
                          required
                          disabled
                        >
                          <MenuItem value="Not Listed">Not Listed</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    {formData.companyId === 'Not Listed' && (
                      <TextField
                        fullWidth
                        name="companyNameManual"
                        value={formData.companyNameManual}
                        onChange={onChange}
                        placeholder="Type company name"
                        required
                        sx={{
                          ...fieldSx,
                          mt: 2
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <FaBuilding size={18} style={{ color: COLORS.secondaryBrown }} />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <FieldLabel icon={FaBuilding} text="Company" />
                    <FormControl fullWidth sx={fieldSx}>
                      <Select value="" displayEmpty disabled>
                        <MenuItem value="">Disabled for individual delivery</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                )}

                <div>
                  <FieldLabel icon={FaUser} text="Receiver/Representative Name" required />
                  <TextField
                    fullWidth
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={onChange}
                    placeholder="Enter receiver name"
                    required
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaUser size={18} style={{ color: COLORS.primaryBrown }} />
                        </InputAdornment>
                      )
                    }}
                  />
                </div>
              </div>
            </Box>

            {/* Delivery Details Section */}
            <Box sx={{ pb: 4, borderBottom: '1px solid #e8e8e8' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                    <FieldLabel icon={FaUser} text="Deliverer Name" required />
                    <TextField
                    fullWidth
                    name="delivererName"
                    value={formData.delivererName}
                    onChange={onChange}
                    placeholder="Name of the person delivering"
                    required
                    sx={fieldSx}
                    InputProps={{
                        startAdornment: (
                        <InputAdornment position="start">
                            <FaUser size={18} style={{ color: COLORS.primaryBrown }} />
                        </InputAdornment>
                        )
                    }}
                    />
                </div>
            <div>
              <FieldLabel icon={FaBoxOpen} text="Delivery Type" required />
              <Box
                sx={{
                  p: 2.5,
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 0.3s ease',
                  '&:focus-within': { borderColor: COLORS.accentBrown }
                }}
              >
                <Stack spacing={2}>
                  {(Array.isArray(formData.deliveryItems) ? formData.deliveryItems : []).map((item, index) => (
                    <Stack 
                      key={item.id} 
                      spacing={1.5}
                      sx={{ 
                        pb: index !== formData.deliveryItems.length - 1 ? 2 : 0,
                        borderBottom: index !== formData.deliveryItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        {/* Dropdown Selection */}
                        <FormControl fullWidth sx={fieldSx}>
                          <Select
                            value={item.name || ''}
                            onChange={(event) => updateDeliveryItem(item.id, 'name', event.target.value)}
                            displayEmpty
                            renderValue={(selected) => {
                              if (!selected) return <span style={{ color: '#999' }}>Select type...</span>
                              return selected
                            }}
                          >
                            {deliveryTypeOptions.map((option) => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Modern Quantity Stepper & Delete */}
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              height: 56,
                              backgroundColor: '#f5f5f5',
                              borderRadius: '12px',
                              px: 1,
                              border: '1px solid #e0e0e0'
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => adjustDeliveryItemQuantity(item.id, -1)}
                              sx={{ color: COLORS.primaryBrown }}
                            >
                              <Typography variant="h6" sx={{ lineHeight: 1 }}>-</Typography>
                            </IconButton>

                            <Typography sx={{ minWidth: 40, textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                              {normalizeQuantity(item.quantity)}
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={() => adjustDeliveryItemQuantity(item.id, 1)}
                              sx={{ color: COLORS.primaryBrown }}
                            >
                              <Typography variant="h6" sx={{ lineHeight: 1 }}>+</Typography>
                            </IconButton>
                          </Box>

                          <IconButton
                            onClick={() => removeDeliveryItem(item.id)}
                            sx={{
                              height: 56,
                              width: 56,
                              borderRadius: '12px',
                              color: '#ff4444',
                              backgroundColor: 'rgba(255, 68, 68, 0.05)',
                              '&:hover': { backgroundColor: 'rgba(255, 68, 68, 0.1)' }
                            }}
                          >
                            <FaTrashAlt size={18} />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {isOtherDeliveryType(item.name) ? (
                        <TextField
                          fullWidth
                          value={item.customName || ''}
                          onChange={(event) => updateDeliveryItem(item.id, 'customName', event.target.value)}
                          placeholder="Type custom delivery type"
                          required
                          sx={fieldSx}
                        />
                      ) : null}
                    </Stack>
                  ))}

                  {/* Add Button & Footer */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                    <Button
                      type="button"
                      onClick={addDeliveryItem}
                      startIcon={<span>+</span>}
                      sx={{
                        color: COLORS.primaryBrown,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        '&:hover': { backgroundColor: 'transparent', color: '#888' }
                      }}
                    >
                      Add another type
                    </Button>

                    <Box sx={{ px: 2, py: 0.5, borderRadius: '8px', backgroundColor: '#fdfdf1', border: '1px solid #e4eb9f' }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#3f3f00' }}>
                        TOTAL ITEMS: {totalItems}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
              {isDeliveryTypesError && (
                <Typography sx={{ mt: 1, fontSize: '0.85rem', color: '#b45309' }}>
                  Could not load delivery types.
                </Typography>
              )}
            </div>
              <div className="hidden xl:block" aria-hidden="true" />
            </div>
            </Box>

            {/* Delivery Method Section */}
            <Box sx={{ pb: 4, borderBottom: '1px solid #e8e8e8' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                <FieldLabel icon={FaTruck} text="Delivery By" required />
                <FormControl fullWidth sx={fieldSx}>
                  <Select
                    name="deliveryByType"
                    value={formData.deliveryByType}
                    onChange={onChange}
                    displayEmpty
                    required
                    disabled={isDeliveryPartnersLoading}
                  >
                    <MenuItem value="" disabled>
                      {isDeliveryPartnersLoading ? 'Loading delivery by types...' : 'Select delivery by'}
                    </MenuItem>
                    {deliveryByTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                </div>

                {formData.deliveryByType === 'Courier' ? (
                  <div>
                  <FieldLabel icon={FaTruck} text="Courier Partner" required />
                  <FormControl fullWidth sx={fieldSx}>
                    <Select
                      name="deliveryPartner"
                      value={formData.deliveryPartner}
                      onChange={onChange}
                      displayEmpty
                      required
                      disabled={isDeliveryPartnersLoading}
                    >
                      <MenuItem value="" disabled>
                        {isDeliveryPartnersLoading ? 'Loading courier partners...' : 'Select courier partner'}
                      </MenuItem>
                      {deliveredByOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {isDeliveryPartnersError && (
                    <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#b45309' }}>
                      Could not load courier partners. Please refresh and try again.
                    </Typography>
                  )}
                  {!isDeliveryPartnersLoading && deliveredByOptions.length === 0 ? (
                    <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#b45309' }}>
                      No courier partners available. Please ask admin to create at least one courier partner.
                    </Typography>
                  ) : null}
                </div>
                ) : null}

                {formData.deliveryByType === 'Supplier' ? (
                  <div>
                    <FieldLabel icon={FaRegFileAlt} text="Supplier Description" required />
                    <TextField
                      fullWidth
                      name="supplierDescription"
                      value={formData.supplierDescription}
                      onChange={onChange}
                      placeholder="Enter supplier information"
                      required
                      sx={fieldSx}
                    />
                  </div>
                ) : null}

                {formData.deliveryByType === '' ? (
                  <div className="hidden md:block" aria-hidden="true" />
                ) : null}

                {formData.deliveryByType !== '' ? (
                  <div className="hidden xl:block" aria-hidden="true" />
                ) : null}
            </div>
            </Box>

            {/* Additional Information Section */}
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.primaryBrown, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
               Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                name="description"
                value={formData.description}
                onChange={onChange}
                placeholder="Enter delivery notes (optional)"
                sx={textareaSx}
              />
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="flex-end" spacing={2} sx={{ pt: 4, mt: 4, borderTop: '1px solid #e8e8e8' }}>
              {hasFormChanges && (
                <Button
                  type="button"
                  onClick={() => setFormData(initialForm)}
                  variant="outlined"
                  sx={{
                    height: 48,
                    px: 4,
                    borderRadius: '12px',
                    borderColor: '#ddd',
                    color: COLORS.textMuted,
                    fontWeight: 600,
                    fontSize: '1rem',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#999',
                      background: 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  Reset
                </Button>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={createLogMutation.isPending}
                sx={{
                  height: 48,
                  px: 5,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: '0 4px 16px rgba(221,232,71,0.3)',
                  background: 'linear-gradient(135deg, #dde847 0%, #e8f058 100%)',
                  color: '#000000',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 28px rgba(221,232,71,0.4)',
                    transform: 'translateY(-2px)'
                  },
                  '&.Mui-disabled': {
                    background: 'linear-gradient(135deg, #dde847 0%, #e8f058 100%)',
                    color: '#000000',
                    opacity: 0.7
                  }
                }}
              >
                {createLogMutation.isPending ? (
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <CircularProgress size={16} thickness={5} sx={{ color: '#000000' }} />
                    <span>Sending...</span>
                  </Stack>
                ) : (
                  'Submit'
                )}
              </Button>
            </Stack>
            {submitted && <Alert severity="success">Delivery log submitted successfully! Redirecting...</Alert>}
            {createLogMutation.isError && (
              <Alert severity="error">{submitError || 'Failed to submit delivery log. Please try again.'}</Alert>
            )}
          </form>
        </div>
      </div>

      {canRenderSummaryModal ? (
        <DeliverySummaryModal
          open={showSummary}
          onClose={() => setShowSummary(false)}
          onConfirm={submitForm}
          summaryData={summaryData}
          isSubmitting={createLogMutation.isPending}
        />
      ) : null}
    </div>
  )
}
