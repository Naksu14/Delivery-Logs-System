import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Stack,
  SvgIcon,
  useMediaQuery
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { getDeliveryLogs, verifyAndReleaseDelivery } from '../../../services/deliveriesServices'
import deliverySocketService, { DELIVERY_SOCKET_EVENTS } from '../../../services/deliverySocketService'
import KioskBlobsBackground from '../components/KioskBlobsBackground';

const COLORS = {
  background: '#ffffff',
  surface: '#fbfbfb',
  surfaceAlt: '#f6f6f6',
  text: '#000000',
  muted: '#666666',
  border: '#e8e8e8',
  accent: '#dde847'
}

function ArrowBackRoundedIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </SvgIcon>
  )
}

function DescriptionOutlinedIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5L18.5 9H14zM6 20V4h6v6h6v10zM8 13h8v2H8zm0 4h8v2H8z" />
    </SvgIcon>
  )
}

function SearchRoundedIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.47 6.47 0 0 0 4.23-1.57l.27.28v.79L20 21.5 21.5 20zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
    </SvgIcon>
  )
}

function Inventory2RoundedIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M20 5h-3.17L15 3H9L7.17 5H4a2 2 0 0 0-2 2v2h20V7a2 2 0 0 0-2-2zm0 6H4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8zm-6 5h-4v-2h4v2z" />
    </SvgIcon>
  )
}

const StyledTableContainer = styled(TableContainer)(() => ({
  width: '100%',
  borderRadius: '24px',
  backgroundColor: COLORS.background,
  border: `1px solid ${COLORS.border}`,
  boxShadow: '0 18px 40px rgba(0,0,0,0.08)',
  overflow: 'hidden'
}))

const HeaderCell = styled(TableCell)(() => ({
  color: COLORS.text,
  borderBottom: `1px solid ${COLORS.border}`,
  fontWeight: 800,
  fontSize: '0.85rem',
  padding: '14px 12px',
  background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'normal',
  lineHeight: 1.2
}))

const BodyCell = styled(TableCell)(() => ({
  color: COLORS.text,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: '0.86rem',
  padding: '12px 10px',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  lineHeight: 1.35
}))

const StatCard = styled(Box)(() => ({
  borderRadius: '18px',
  border: `1px solid ${COLORS.border}`,
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
  padding: '14px 16px'
}))

const StatusChip = styled('span')(({ status }) => {
  const s = String(status || '').toLowerCase()
  const isPending = s === 'pending'
  const isReleased = s === 'released'
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    padding: '4px 9px',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.02em',
    color: isPending ? '#000000' : '#ffffff',
    backgroundColor: isPending ? COLORS.accent : isReleased ? '#16a34a' : '#1a1a1a',
    boxShadow: isPending ? '0 8px 16px rgba(221,232,71,0.25)' : isReleased ? '0 8px 16px rgba(22,163,74,0.18)' : '0 8px 16px rgba(0,0,0,0.12)'
  }
})

const columnConfig = [
  { id: 'date_received', label: 'Date Delivered', shortLabel: 'Delivered', weight: 13 },
  { id: 'company_name', label: 'Company', shortLabel: 'Company', weight: 25 },
  { id: 'delivery_type', label: 'Type', shortLabel: 'Type', weight: 9 },
  { id: 'partner', label: 'Partner', shortLabel: 'Partner', weight: 14 },
  { id: 'deliverer_name', label: 'Deliverer', shortLabel: 'Deliverer', weight: 13 },
  { id: 'is_status', label: 'Status', shortLabel: 'Status', weight: 10 },
  { id: 'received_by', label: 'Received By', shortLabel: 'Recv By', weight: 8 },
  { id: 'received_at', label: 'Date Received', shortLabel: 'Date Rec', weight: 8 },
  { id: 'action', label: 'Action', shortLabel: 'Action', weight: 10 }
]

function normalizeWeights(columns) {
  const totalWeight = columns.reduce((acc, column) => acc + column.weight, 0)
  if (!totalWeight) return columns.map(() => 0)
  return columns.map((column) => (column.weight / totalWeight) * 100)
}

export default function KioskHistoryLogs() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const under1720 = useMediaQuery('(max-width:1720px)')
  const under1366 = useMediaQuery('(max-width:1366px)')
  const under1080 = useMediaQuery('(max-width:1080px)')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [verificationError, setVerificationError] = useState('')
  const [verificationForm, setVerificationForm] = useState({
    reference_code: '',
    received_by: ''
  })
  const [isSignaturePresent, setIsSignaturePresent] = useState(false)

  const signatureCanvasRef = useRef(null)
  const drawingRef = useRef(false)

  const verifyReleaseMutation = useMutation({
    mutationFn: ({ id, payload }) => verifyAndReleaseDelivery(id, payload),
    onSuccess: () => {
      setVerificationError('')
      setVerifyDialogOpen(false)
      setSelectedDelivery(null)
      setVerificationForm({ reference_code: '', received_by: '' })
      setIsSignaturePresent(false)
      queryClient.invalidateQueries({ queryKey: ['deliveryLogs'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['deliveries'], refetchType: 'active' })
    },
    onError: (error) => {
      const message = error?.response?.data?.message
      if (Array.isArray(message)) {
        setVerificationError(message.join(' '))
      } else {
        setVerificationError(message || 'Failed to verify reference code and release delivery.')
      }
    }
  })

  const resetVerificationForm = () => {
    setVerificationError('')
    setVerificationForm({ reference_code: '', received_by: '' })
    setIsSignaturePresent(false)
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    setIsSignaturePresent(false)
  }

  const setupSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const parentWidth = canvas.parentElement?.clientWidth || 560
    const displayWidth = Math.max(260, parentWidth - 4)
    const parentHeight = canvas.parentElement?.clientHeight || 220
    const displayHeight = Math.max(160, parentHeight)
    const ratio = window.devicePixelRatio || 1

    canvas.width = displayWidth * ratio
    canvas.height = displayHeight * ratio
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    const context = canvas.getContext('2d')
    if (!context) return

    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.lineWidth = 2.2
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = '#111111'
    context.clearRect(0, 0, displayWidth, displayHeight)
  }

  const getPointerCoordinates = (event) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const point = 'touches' in event ? event.touches[0] : event

    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    }
  }

  const startDrawing = (event) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    drawingRef.current = true
    const { x, y } = getPointerCoordinates(event)
    context.beginPath()
    context.moveTo(x, y)
    setIsSignaturePresent(true)

    if ('touches' in event && event.cancelable) {
      event.preventDefault()
    }
  }

  const drawLine = (event) => {
    if (!drawingRef.current) return

    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const { x, y } = getPointerCoordinates(event)
    context.lineTo(x, y)
    context.stroke()

    if ('touches' in event && event.cancelable) {
      event.preventDefault()
    }
  }

  const stopDrawing = () => {
    drawingRef.current = false
  }

  const openVerifyDialog = (delivery) => {
    setSelectedDelivery(delivery)
    resetVerificationForm()
    setVerifyDialogOpen(true)
  }

  const closeVerifyDialog = () => {
    if (verifyReleaseMutation.isPending) return
    setVerifyDialogOpen(false)
    setSelectedDelivery(null)
    resetVerificationForm()
  }

  const submitVerification = () => {
    if (!selectedDelivery?.id) return

    const normalizedCode = verificationForm.reference_code.trim().toUpperCase()
    const receivedBy = verificationForm.received_by.trim()

    if (!/^[A-Z0-9]{5}$/.test(normalizedCode)) {
      setVerificationError('Reference code must be exactly 5 uppercase letters or numbers.')
      return
    }

    if (!receivedBy) {
      setVerificationError('Receiver name is required.')
      return
    }

    if (!isSignaturePresent) {
      setVerificationError('Receiver signature is required.')
      return
    }

    const signature = signatureCanvasRef.current?.toDataURL('image/png')

    if (!signature) {
      setVerificationError('Unable to capture signature. Please sign again.')
      return
    }

    setVerificationError('')
    verifyReleaseMutation.mutate({
      id: selectedDelivery.id,
      payload: {
        reference_code: normalizedCode,
        received_by: receivedBy,
        receiver_signature: signature
      }
    })
  }

  const { data: logs = [], isLoading, isError, error } = useQuery({
    queryKey: ['deliveryLogs'],
    queryFn: getDeliveryLogs,
    select: (data) => {
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.items)) return data.items
      return []
    }
  })

  useEffect(() => {
    const socket = deliverySocketService.retain()

    setIsRealtimeConnected(socket.connected)

    const handleConnect = () => {
      setIsRealtimeConnected(true)
      queryClient.invalidateQueries({ queryKey: ['deliveryLogs'], refetchType: 'active' })
    }

    const handleDisconnect = () => {
      setIsRealtimeConnected(false)
    }

    const handleRealtimeChange = () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryLogs'], refetchType: 'active' })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    const offCreated = deliverySocketService.on(DELIVERY_SOCKET_EVENTS.CREATED, handleRealtimeChange)
    const offUpdated = deliverySocketService.on(DELIVERY_SOCKET_EVENTS.UPDATED, handleRealtimeChange)
    const offDeleted = deliverySocketService.on(DELIVERY_SOCKET_EVENTS.DELETED, handleRealtimeChange)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      offCreated()
      offUpdated()
      offDeleted()
      deliverySocketService.release()
    }
  }, [queryClient])

  useEffect(() => {
    if (!verifyDialogOpen) {
      return undefined
    }

    const frame = window.requestAnimationFrame(() => {
      setupSignatureCanvas()
    })

    const handleResize = () => {
      setupSignatureCanvas()
      setIsSignaturePresent(false)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
      drawingRef.current = false
    }
  }, [verifyDialogOpen])

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return logs
      .filter((log) => {
        if (statusFilter === 'All') return true
        if (statusFilter === 'Received') return String(log?.is_status || '').toLowerCase() === 'released'
        return String(log?.is_status || '').toLowerCase() === statusFilter.toLowerCase()
      })
      .filter((log) => {
        if (!keyword) return true

        const haystack = [
          log?.company_name,
          log?.delivery_type,
          log?.delivery_partner,
          log?.courier_type_name,
          log?.supplier_description,
          log?.deliverer_name,
          log?.received_by,
          log?.is_status
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(keyword)
      })
      .sort((a, b) => new Date(b?.date_received || 0).getTime() - new Date(a?.date_received || 0).getTime())
  }, [logs, search, statusFilter])

  const totalLogs = logs.length
  const pendingLogs = logs.filter((log) => String(log?.is_status).toLowerCase() === 'pending').length
  const releasedLogs = logs.filter((log) => String(log?.is_status).toLowerCase() === 'released').length

  const visibleColumns = useMemo(() => columnConfig, [])

  const columnWidths = useMemo(() => normalizeWeights(visibleColumns), [visibleColumns])

  const formatTime = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCellValue = (log, columnId) => {
    if (columnId === 'date_received') {
      const date = formatDate(log?.date_received)
      const time = formatTime(log?.date_received)
      return date === '—' ? '—' : `${date} ${time}`
    }
    if (columnId === 'partner') return log?.courier_type_name || log?.supplier_description || log?.delivery_partner || '—'
    if (columnId === 'received_at') {
      // Only show received_at if delivery has been verified/released
      const isReleased = String(log?.is_status || '').toLowerCase() === 'released'
      if (!isReleased) return '—'
      const date = formatDate(log?.received_at)
      const time = formatTime(log?.received_at)
      return date === '—' ? '—' : `${date} ${time}`
    }
    if (columnId === 'is_status') {
      const raw = log?.is_status || 'Pending'
      return String(raw).toLowerCase() === 'released' ? 'Received' : raw
    }
    return log?.[columnId] || '—'
  }

  return (
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: COLORS.background }}>
      <KioskBlobsBackground opacity={0.7} />

      <div className="relative z-10 min-h-screen px-5 py-6">
        <Box
          sx={{
            mb: 8,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto' },
            alignItems: 'center',
            gap: 2
          }}
        >
          <Button
            onClick={() => navigate('/kiosk')}
            startIcon={<ArrowBackRoundedIcon />}
            variant="outlined"
            sx={{
              justifySelf: { xs: 'start', md: 'start' },
              height: 48,
              borderRadius: '14px',
              px: 3,
              borderColor: '#dddddd',
              color: COLORS.text,
              backgroundColor: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
              '&:hover': {
                borderColor: COLORS.accent,
                backgroundColor: '#fffdf0'
              }
            }}
          >
            Back to home
          </Button>

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ justifySelf: { xs: 'start', md: 'center' }, width: '100%', minWidth: 0 }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #dde847 0%, #e8f058 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                boxShadow: '0 12px 24px rgba(221,232,71,0.24)'
              }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: '1.7rem' }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: '1.45rem', sm: '1.9rem' }, fontWeight: 900, color: COLORS.text, lineHeight: 1.1 }}>
                Delivery History Logs
              </Typography>
              <Typography sx={{ color: COLORS.muted, fontSize: { xs: '0.9rem', sm: '0.98rem' }, fontWeight: 500 }}>
                Search, filter, and review recent delivery records.
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ display: { xs: 'none', md: 'block' }, width: 170 }} />
        </Box>

        <Box
          sx={{
            mb: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.7,
            borderRadius: '999px',
            border: `1px solid ${isRealtimeConnected ? '#d0e8a7' : '#f2d4a9'}`,
            backgroundColor: isRealtimeConnected ? '#f4fae4' : '#fff6ea',
            color: '#111827',
            fontSize: '0.76rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: isRealtimeConnected ? '#16a34a' : '#f59e0b',
              boxShadow: isRealtimeConnected
                ? '0 0 0 4px rgba(22,163,74,0.16)'
                : '0 0 0 4px rgba(245,158,11,0.16)'
            }}
          />
          {isRealtimeConnected ? 'Live updates on' : 'Reconnecting live updates'}
        </Box>

        <Box sx={{ mb: 3, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
          <StatCard>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.7 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: '#fff9c8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inventory2RoundedIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography sx={{ color: COLORS.muted, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Total Logs
              </Typography>
            </Stack>
            <Typography sx={{ color: COLORS.text, fontSize: '1.7rem', fontWeight: 900 }}>{totalLogs}</Typography>
          </StatCard>

          <StatCard>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.7 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: '#eef4b0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 900 }}>P</Typography>
              </Box>
              <Typography sx={{ color: COLORS.muted, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Pending
              </Typography>
            </Stack>
            <Typography sx={{ color: COLORS.text, fontSize: '1.7rem', fontWeight: 900 }}>{pendingLogs}</Typography>
          </StatCard>

          <StatCard>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.7 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: '#e9f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 900 }}>R</Typography>
              </Box>
              <Typography sx={{ color: COLORS.muted, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Received
              </Typography>
            </Stack>
            <Typography sx={{ color: COLORS.text, fontSize: '1.7rem', fontWeight: 900 }}>{releasedLogs}</Typography>
          </StatCard>
        </Box>

        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: '18px',
            border: `1px solid ${COLORS.border}`,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 1.5
          }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth
            placeholder="Search by company, type, partner, or deliverer..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: COLORS.muted, fontSize: 20 }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                '& fieldset': { borderColor: '#e2e2e2' },
                '&:hover fieldset': { borderColor: COLORS.accent },
                '&.Mui-focused fieldset': { borderColor: COLORS.accent }
              }
            }}
          />

          <FormControl fullWidth>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e2e2' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.accent },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.accent }
              }}
            >
              <MenuItem value="All">All statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Received">Received</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
            <CircularProgress sx={{ color: COLORS.accent }} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error fetching delivery logs: {error?.message || 'Unknown error'}
          </Alert>
        )}

        {!isLoading && !isError && (
          <StyledTableContainer component={Paper}>
            <Table aria-label="delivery logs table" sx={{ width: '100%', tableLayout: 'fixed' }}>
              <colgroup>
                {columnWidths.map((width, index) => (
                  <col key={`col-${visibleColumns[index].id}`} style={{ width: `${width}%` }} />
                ))}
              </colgroup>
              <TableHead>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <HeaderCell
                      key={column.id}
                      sx={
                        under1080
                          ? { fontSize: '0.7rem', padding: '10px 8px', letterSpacing: '0.02em' }
                          : under1366
                            ? { fontSize: '0.74rem', padding: '11px 9px' }
                            : under1720
                              ? { fontSize: '0.78rem', padding: '12px 10px' }
                              : undefined
                      }
                    >
                      {under1080 ? column.shortLabel : column.label}
                    </HeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <BodyCell
                      colSpan={visibleColumns.length}
                      sx={{ textAlign: 'center', py: 6, color: COLORS.muted }}
                    >
                      No logs match your current search or filter.
                    </BodyCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} hover sx={{ '&:hover td': { backgroundColor: '#fffef5' } }}>
                      {visibleColumns.map((column) => (
                        <BodyCell
                          key={`${log.id}-${column.id}`}
                          sx={
                            under1080
                              ? { fontSize: '0.73rem', padding: '9px 7px', lineHeight: 1.25 }
                              : under1366
                                ? { fontSize: '0.78rem', padding: '10px 8px' }
                                : under1720
                                  ? { fontSize: '0.82rem', padding: '10px 9px' }
                                  : undefined
                          }
                        >
                          {column.id === 'action' ? (
                            String(log?.is_status || '').toLowerCase() === 'pending' ? (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => openVerifyDialog(log)}
                                disabled={verifyReleaseMutation.isPending}
                                sx={{
                                  minWidth: under1080 ? 72 : 96,
                                  height: under1080 ? 28 : 32,
                                  borderRadius: '999px',
                                  backgroundColor: '#111111',
                                  color: '#ffffff',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: under1080 ? '0.64rem' : '0.72rem',
                                  px: under1080 ? 1.1 : 1.6,
                                  '&:hover': {
                                    backgroundColor: '#272727'
                                  }
                                }}
                              >
                                Verify
                              </Button>
                            ) : (
                              <Typography sx={{ fontSize: under1080 ? '0.67rem' : '0.73rem', color: COLORS.muted, fontWeight: 700 }}>
                                Completed
                              </Typography>
                            )
                          ) : column.id === 'is_status' ? (
                            <StatusChip
                              status={log.is_status}
                              style={
                                under1080
                                  ? { minWidth: 56, padding: '3px 8px', fontSize: '0.66rem' }
                                  : under1366
                                    ? { minWidth: 60, padding: '4px 9px', fontSize: '0.69rem' }
                                    : under1720
                                      ? { minWidth: 62, padding: '4px 9px', fontSize: '0.7rem' }
                                      : undefined
                              }
                            >
                              {getCellValue(log, column.id)}
                            </StatusChip>
                          ) : (
                            getCellValue(log, column.id)
                          )}
                        </BodyCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}

        {verifyDialogOpen ? (
          <div className="fixed inset-0 z-[70] px-4 py-6 sm:px-6" role="dialog" aria-modal="true" aria-label="Verify Delivery Release">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
              onClick={closeVerifyDialog}
              aria-label="Close verification dialog"
              disabled={verifyReleaseMutation.isPending}
            />

            <div className="relative z-10 mx-auto flex min-h-full max-w-4xl items-center">
              <div className="flex w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_35px_90px_rgba(0,0,0,0.28)]">
                <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-[#dde847] via-[#d9e74a] to-[#cfe03a] p-6 sm:p-7">
                  <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/20" />
                  <div className="absolute -bottom-14 right-20 h-36 w-36 rounded-full bg-black/5" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-black shadow">
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-2xl font-black tracking-tight text-black sm:text-[1.75rem]">Verify Delivery Release</span>
                        <p className="mt-1 text-sm font-medium text-black/70">Confirm reference code, receiver name, and signature before release.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeVerifyDialog}
                      disabled={verifyReleaseMutation.isPending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/65 text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Close verification dialog"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                        <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4l-6.3 6.3-1.42-1.42L9.17 12l-6.3-6.29L4.29 4.3l6.3 6.3 6.3-6.3z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Delivery</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{selectedDelivery?.company_name || selectedDelivery?.recipient_name || 'Unknown recipient'}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="verify-reference-code" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.07em] text-slate-600">Reference Code</label>
                      <input
                        id="verify-reference-code"
                        type="text"
                        placeholder="Enter 5-character code"
                        value={verificationForm.reference_code}
                        onChange={(event) => setVerificationForm((prev) => ({
                          ...prev,
                          reference_code: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
                        }))}
                        maxLength={5}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold uppercase tracking-[0.24em] text-slate-900 outline-none transition focus:border-[#c4d532] focus:ring-4 focus:ring-[#dde847]/25"
                      />
                    </div>

                    <div>
                      <label htmlFor="verify-receiver-name" className="mb-1 block text-xs font-extrabold uppercase tracking-[0.07em] text-slate-600">Receiver Name</label>
                      <input
                        id="verify-receiver-name"
                        type="text"
                        placeholder="Full name of receiver"
                        value={verificationForm.received_by}
                        onChange={(event) => setVerificationForm((prev) => ({ ...prev, received_by: event.target.value }))}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#c4d532] focus:ring-4 focus:ring-[#dde847]/25"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <label className="text-xs font-extrabold uppercase tracking-[0.07em] text-slate-600">Receiver Signature</label>
                        <button
                          type="button"
                          onClick={clearSignature}
                          disabled={verifyReleaseMutation.isPending}
                          className="text-xs font-bold text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Clear
                        </button>
                      </div>
                      <div className={`rounded-2xl border bg-white p-2 shadow-inner transition ${isSignaturePresent ? 'border-lime-400' : 'border-dashed border-slate-300'}`}>
                        <div className="relative h-56 overflow-hidden rounded-xl bg-slate-50 sm:h-52">
                          <canvas
                            ref={signatureCanvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={drawLine}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={drawLine}
                            onTouchEnd={stopDrawing}
                            style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
                          />

                          {!isSignaturePresent && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
                              <div className="rounded-md px-3 py-1 text-sm font-extrabold text-slate-400">Sign here</div>
                              <div className="mt-1 text-[11px] font-medium text-slate-400">Use stylus to sign</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {verificationError ? (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {verificationError}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-7">
                  <button
                    type="button"
                    onClick={closeVerifyDialog}
                    disabled={verifyReleaseMutation.isPending}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitVerification}
                    disabled={verifyReleaseMutation.isPending}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyReleaseMutation.isPending ? 'Verifying...' : 'Verify and Release'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
