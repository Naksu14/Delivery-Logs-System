import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'

function FactCheckRoundedIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </SvgIcon>
  )
}

function CloseRoundedIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </SvgIcon>
  )
}

function SummaryRow({ label, value, icon: Icon }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      {Icon && (
        <Box sx={{ pt: 0.5, color: '#dde847', display: 'flex', alignItems: 'center' }}>
          <Icon fontSize="small" />
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999999', mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#000000', wordBreak: 'break-word', lineHeight: 1.4 }}>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  )
}

export default function DeliverySummaryModal({ open, onClose, onConfirm, summaryData }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '10px',
          background: '#ffffff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Modern Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #dde847 0%, #e8f058 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'rgba(0,0,0,0.04)', borderRadius: '50%' }} />
        
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1 }}>
            <Box
              sx={{
                height: 48,
                width: 48,
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              <FactCheckRoundedIcon sx={{ fontSize: '1.6rem' }} />
            </Box>
            
            <Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#000000', lineHeight: 1.2 }}>
                Confirm Delivery
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: '0.9rem', color: 'rgba(0,0,0,0.6)', fontWeight: 500 }}>
                Review and confirm the delivery details
              </Typography>
            </Box>
          </Stack>
          
          <IconButton 
            onClick={onClose} 
            aria-label="Close" 
            sx={{ 
              color: '#000000',
              background: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              '&:hover': { background: 'rgba(255,255,255,0.5)' },
              transition: 'all 0.2s ease'
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          {/* Date Section */}
          <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SummaryRow label="Date Received" value={summaryData.dateReceivedPretty} />
            </CardContent>
          </Card>

          {/* Delivery For Section */}
          <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SummaryRow label="Delivery For" value={summaryData.deliveryFor} />
            </CardContent>
          </Card>

          {/* Company Section */}
          {summaryData.deliveryFor === 'Company' && (
            <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SummaryRow label="Company" value={summaryData.companyDisplayName || summaryData.companyNameManual} />
              </CardContent>
            </Card>
          )}

          {/* Recipient Name */}
          <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SummaryRow label="Recipient Name" value={summaryData.recipientName} />
            </CardContent>
          </Card>

          {/* Deliverer Name */}
          <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SummaryRow label="Deliverer Name" value={summaryData.delivererName} />
            </CardContent>
          </Card>

          {/* Delivery Type */}
          <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SummaryRow label="Delivery Type" value={summaryData.deliveryType} />
            </CardContent>
          </Card>

          {/* Delivery By */}
          <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <SummaryRow label="Delivered By" value={summaryData.deliveryPartner} />
            </CardContent>
          </Card>

          {/* Courier Type (conditional) */}
          {summaryData.courierTypeName && (
            <Card sx={{ border: 'none', background: '#f9f9f9', boxShadow: 'none', borderRadius: '12px' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SummaryRow label="Courier Service" value={summaryData.courierTypeName} />
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Description Section */}
        {summaryData.description && (
          <>
            <Divider sx={{ mx: 3, my: 2, background: '#e8e8e8' }} />
            <Box sx={{ px: 3, pb: 3 }}>
              <Card sx={{ border: '1px solid #e8e8e8', background: '#fafafa', boxShadow: 'none', borderRadius: '12px' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999999', mb: 1 }}>
                    Notes
                  </Typography>
                  <Typography sx={{ fontSize: '0.95rem', color: '#333333', lineHeight: 1.6, fontWeight: 500 }}>
                    {summaryData.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </DialogContent>

      {/* Modern Footer */}
      <DialogActions sx={{ p: 3, gap: 2, background: '#f9f9f9', borderTop: '1px solid #e8e8e8' }}>
        <Button 
          autoFocus
          onClick={onClose} 
          variant="outlined" 
          sx={{ 
            borderColor: '#ddd',
            color: '#666',
            fontWeight: 600,
            borderRadius: '10px',
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontSize: '0.95rem',
            flex: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#999',
              background: 'rgba(0,0,0,0.02)'
            }
          }}
        >
          Edit
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          sx={{ 
            fontWeight: 700,
            borderRadius: '10px',
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #dde847 0%, #e8f058 100%)',
            color: '#000000',
            boxShadow: '0 4px 16px rgba(221,232,71,0.3)',
            flex: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(221,232,71,0.4)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
