import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'

import { FaBoxOpen, FaBuilding, FaRegFileAlt, FaTruck, FaUser } from 'react-icons/fa'
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
  deliveryType: '',
  deliveryPartner: '',
  courierTypeName: '',
  supplierDescription: '',
  delivererName: '',
  description: '',
  is_status: 'Pending'
}

const defaultDeliveryPartnerOptions = ['Supplier', 'Courier']
const defaultDeliveryTypeOptions = ['Parcel', 'Mail', 'Other']
const courierOptions = ['LBC', 'J&T Express', 'Ninja Van', 'Grab', 'Lalamove', 'Other']
const companySelectPlaceholder = 'Select company'

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
      setFormData(initialForm)
      navigate('/kiosk/success');
    },
    onError: (error) => {
      console.error('Error creating delivery log:', error)
      // You could show an error alert here
    }
  })

  const deliveredByOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        deliveryPartners
          .map((partner) => formatTypeLabel(partner?.type))
          .filter(Boolean)
      )
    )

    return types.length > 0 ? types : defaultDeliveryPartnerOptions
  }, [deliveryPartners])

  const deliveryTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        deliveryTypes
          .map((deliveryType) => formatNameLabel(deliveryType?.name))
          .filter(Boolean)
      )
    )

    return types.length > 0 ? types : defaultDeliveryTypeOptions
  }, [deliveryTypes])

  const courierTypeOptions = useMemo(() => {
    const couriers = Array.from(
      new Set(
        deliveryPartners
          .filter((partner) => formatTypeLabel(partner?.type) === 'Courier')
          .map((partner) => partner?.name)
          .filter(Boolean)
      )
    )

    return couriers.length > 0 ? couriers : courierOptions
  }, [deliveryPartners])

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
      companyDisplayName,
      dateReceivedPretty: prettyDate(currentDateReceived)
    }
  }, [formData, companies, currentDateReceived])

  const onChange = (event) => {
    const { name, value } = event.target
    setSubmitted(false)

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
        courierTypeName: value === 'Courier' ? prev.courierTypeName : '',
        supplierDescription: value === 'Supplier' ? prev.supplierDescription : ''
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const openSummary = (event) => {
    event.preventDefault()
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }
    setTimeout(() => {
      setShowSummary(true)
    }, 0)
  }

  const submitForm = () => {
    setShowSummary(false)
    const submittedAt = new Date()

    const selectedCompany = companies.find((company) => company.id === Number(formData.companyId))
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
      delivery_type: formData.deliveryType,
      delivery_partner: formData.deliveryPartner,
      courier_type_name: formData.courierTypeName,
      supplier_description: formData.supplierDescription,
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

      <div className="relative z-10 min-h-full px-5 py-6 sm:px-10 lg:px-16">
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

        <div className="mx-auto w-full max-w-5xl rounded-[20px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-6 sm:p-8" style={{ border: `1px solid #e8e8e8`, backgroundColor: '#ffffff' }}>
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
            {/* Recipient Information Section */}
            <Box sx={{ pb: 4, borderBottom: '1px solid #e8e8e8' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2  gap-4">
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
                    <FormControl fullWidth sx={fieldSx}>
                      <Select
                        name="companyId"
                        value={formData.companyId}
                        onChange={onChange}
                        displayEmpty
                        required={formData.deliveryFor === 'Company'}
                        disabled={isCompaniesLoading}
                      >
                        <MenuItem value="" disabled>
                          {isCompaniesLoading ? 'Loading companies...' : companySelectPlaceholder}
                        </MenuItem>
                        {companies.map((company) => (
                          <MenuItem key={company.id} value={String(company.id)}>
                            {getCompanyLabel(company)}
                          </MenuItem>
                        ))}
                        <MenuItem value="Not Listed">Not Listed</MenuItem>
                      </Select>
                    </FormControl>
                    {isCompaniesError && (
                      <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#b45309' }}>
                        Could not load companies. You can still use Not Listed.
                      </Typography>
                    )}
                    {formData.companyId === 'Not Listed' && (
                      <TextField
                        fullWidth
                        name="companyNameManual"
                        value={formData.companyNameManual}
                        onChange={onChange}
                        placeholder="Type company name (optional)"
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
                  <div style={{ visibility: 'hidden' }} aria-hidden="true" />
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: '132px' }}>


                <div>
                  <FieldLabel icon={FaUser} text="Recipient Name" required />
                  <TextField
                    fullWidth
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={onChange}
                    placeholder="Enter recipient name"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <FormControl fullWidth sx={fieldSx}>
                  <Select
                    name="deliveryType"
                    value={formData.deliveryType}
                    onChange={onChange}
                    displayEmpty
                    disabled={isDeliveryTypesLoading}
                  >
                    <MenuItem value="" disabled>
                      {isDeliveryTypesLoading ? 'Loading delivery types...' : 'Select delivery type'}
                    </MenuItem>
                    {deliveryTypeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {isDeliveryTypesError && (
                  <Typography sx={{ mt: 1, fontSize: '0.9rem', color: '#b45309' }}>
                    Could not load delivery types. Using default options.
                  </Typography>
                )}
              </div>              
            </div>
            </Box>

            {/* Delivery Method Section */}
            <Box sx={{ pb: 4, borderBottom: '1px solid #e8e8e8' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                <FieldLabel icon={FaTruck} text="Delivery By" required />
                <FormControl fullWidth sx={fieldSx}>
                  <Select
                    name="deliveryPartner"
                    value={formData.deliveryPartner}
                    onChange={onChange}
                    displayEmpty
                    disabled={isDeliveryPartnersLoading}
                  >
                    <MenuItem value="" disabled>
                      {isDeliveryPartnersLoading ? 'Loading delivery partners...' : 'Select delivery partner'}
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
                    Could not load delivery partners. Using default options.
                  </Typography>
                )}
              </div>
              {formData.deliveryPartner === 'Courier' && (
                <div>
                  <FieldLabel icon={FaTruck} text="Courier Type" required />
                  <FormControl fullWidth sx={fieldSx}>
                    <Select name="courierTypeName" value={formData.courierTypeName} onChange={onChange} displayEmpty>
                      <MenuItem value="" disabled>
                        Select courier type
                      </MenuItem>
                      {courierTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              )}
            </div>
            </Box>

            {/* Additional Information Section */}
            <Box>
              {formData.deliveryPartner === 'Supplier' && (
                <Box sx={{ mb: 4, pb: 4, borderBottom: '1px solid #e8e8e8' }}>
                  <FieldLabel icon={FaRegFileAlt} text="Supplier Description" />
                  <TextField
                    fullWidth
                    name="supplierDescription"
                    value={formData.supplierDescription}
                    onChange={onChange}
                    placeholder="Additional supplier information (optional)"
                    sx={fieldSx}
                  />
                </Box>
              )}

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
                  }
                }}
              >
                Submit
              </Button>
            </Stack>
            {submitted && <Alert severity="success">Delivery log submitted successfully! Redirecting...</Alert>}
            {createLogMutation.isError && <Alert severity="error">Failed to submit delivery log. Please try again.</Alert>}
          </form>
        </div>
      </div>

      {canRenderSummaryModal ? (
        <DeliverySummaryModal
          open={showSummary}
          onClose={() => setShowSummary(false)}
          onConfirm={submitForm}
          summaryData={summaryData}
        />
      ) : null}
    </div>
  )
}
