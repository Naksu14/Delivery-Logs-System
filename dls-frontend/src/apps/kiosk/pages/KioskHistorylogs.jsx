import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  SvgIcon
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { getDeliveryLogs } from '../../../services/deliveriesServices'
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
  padding: '16px 18px',
  background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap'
}))

const BodyCell = styled(TableCell)(() => ({
  color: COLORS.text,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: '0.95rem',
  padding: '18px',
  whiteSpace: 'nowrap'
}))

const StatCard = styled(Box)(() => ({
  borderRadius: '18px',
  border: `1px solid ${COLORS.border}`,
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
  padding: '14px 16px'
}))

const StatusChip = styled('span')(({ status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 96,
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '0.78rem',
  fontWeight: 800,
  letterSpacing: '0.02em',
  color: status === 'Pending' ? '#000000' : '#ffffff',
  backgroundColor: status === 'Pending' ? COLORS.accent : '#1a1a1a',
  boxShadow: status === 'Pending' ? '0 8px 16px rgba(221,232,71,0.25)' : '0 8px 16px rgba(0,0,0,0.12)'
}))

export default function KioskHistoryLogs() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const { data: logs = [], isLoading, isError, error } = useQuery({
    queryKey: ['deliveryLogs'],
    queryFn: getDeliveryLogs,
    select: (data) => {
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.items)) return data.items
      return []
    }
  })

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

  return (
    <div className="fixed inset-0 overflow-auto" style={{ backgroundColor: COLORS.background }}>
      <KioskBlobsBackground opacity={0.7} />

      <div className="relative z-10 min-h-screen px-5 py-6 sm:px-10 lg:px-16">
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
                Released
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
              <MenuItem value="Released">Released</MenuItem>
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
            <Table aria-label="delivery logs table">
              <TableHead>
                <TableRow>
                  <HeaderCell>Date Received</HeaderCell>
                  <HeaderCell>Company</HeaderCell>
                  <HeaderCell>Type</HeaderCell>
                  <HeaderCell>Partner</HeaderCell>
                  <HeaderCell>Deliverer</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Received By</HeaderCell>
                  <HeaderCell>Time Received</HeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <BodyCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: COLORS.muted }}>
                      No logs match your current search or filter.
                    </BodyCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} hover sx={{ '&:hover td': { backgroundColor: '#fffef5' } }}>
                      <BodyCell>{formatDate(log.date_received)}</BodyCell>
                      <BodyCell>{log.company_name || '—'}</BodyCell>
                      <BodyCell>{log.delivery_type || '—'}</BodyCell>
                      <BodyCell>{log.courier_type_name || log.supplier_description || '—'}</BodyCell>
                      <BodyCell>{log.deliverer_name || '—'}</BodyCell>
                      <BodyCell>
                        <StatusChip status={log.is_status}>{log.is_status || 'Pending'}</StatusChip>
                      </BodyCell>
                      <BodyCell>{log.received_by || '—'}</BodyCell>
                      <BodyCell>{formatTime(log.received_at)}</BodyCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}
      </div>
    </div>
  )
}
