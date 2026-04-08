import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { FaCheckCircle, FaHome } from 'react-icons/fa';
import KioskBlobsBackground from '../components/KioskBlobsBackground';

export default function KioskSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown === 0) {
      navigate('/kiosk');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
      <KioskBlobsBackground opacity={0.6} />
      <Box
        className="relative z-10 text-center"
        sx={{
          maxWidth: '500px',
          p: 4,
        }}
      >
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #dde847 0%, #e8f058 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 4,
            boxShadow: '0 10px 30px rgba(221, 232, 71, 0.3)',
          }}
        >
          <FaCheckCircle size={50} style={{ color: '#000000' }} />
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: '#000000',
            mb: 1,
          }}
        >
          Thank you for your delivery!
        </Typography>

        <Typography
          sx={{
            color: '#333333',
            mb: 4,
            fontSize: '1.1rem',
          }}
        >
          Your delivery has been recorded in our system.
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate('/kiosk')}
          startIcon={<FaHome />}
          sx={{
            backgroundColor: '#000000',
            color: '#ffffff',
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            '&:hover': {
              backgroundColor: '#1a1a1a',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            },
          }}
        >
          Return to home
        </Button>

        <Typography
          sx={{
            mt: 3,
            color: '#666666',
            fontSize: '0.9rem',
          }}
        >
          Automatically returning in {countdown} seconds...
        </Typography>
      </Box>
    </div>
  );
}
