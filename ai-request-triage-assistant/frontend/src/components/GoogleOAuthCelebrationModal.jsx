import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Stack,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function GoogleOAuthCelebrationModal({
  open,
  onClose,
  userData,
  emailStatus,
  onEnterWorkspace,
}) {
  const canvasRef = useRef(null);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(100);
  const [stepsVisible, setStepsVisible] = useState([false, false, false, false]);

  // Confetti Particle Simulation
  useEffect(() => {
    if (!open) return;

    // Sequential step reveals
    const timers = [
      setTimeout(() => setStepsVisible((s) => [true, s[1], s[2], s[3]]), 250),
      setTimeout(() => setStepsVisible((s) => [s[0], true, s[2], s[3]]), 500),
      setTimeout(() => setStepsVisible((s) => [s[0], s[1], true, s[3]]), 750),
      setTimeout(() => setStepsVisible((s) => [s[0], s[1], s[2], true]), 1000),
    ];

    // Auto-countdown for entering workspace
    const duration = 3500;
    const intervalTime = 50;
    const stepDec = 100 / (duration / intervalTime);

    const countdownInterval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.max(0, prev - stepDec);
        return next;
      });
    }, intervalTime);

    const numTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(numTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoEnterTimer = setTimeout(() => {
      if (onEnterWorkspace) onEnterWorkspace();
    }, duration);

    // Canvas Confetti
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8b5cf6', '#ec4899', '#06b6d4'];
    const particles = [];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, p.opacity - 0.007);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (particles.some((p) => p.opacity > 0)) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(countdownInterval);
      clearInterval(numTimer);
      clearTimeout(autoEnterTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [open, onEnterWorkspace]);

  if (!open || !userData) return null;

  const userName = userData.name || 'Google User';
  const userEmail = userData.email || 'user@gmail.com';
  const avatarUrl = userData.avatar_url;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #111827 0%, #0b0f19 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.3)' : 'rgba(66, 133, 244, 0.2)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(66, 133, 244, 0.25)'
              : '0 25px 50px -12px rgba(66, 133, 244, 0.25), 0 0 25px rgba(66, 133, 244, 0.15)',
        },
      }}
    >
      {/* Confetti canvas overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Top Google Colored Strip */}
      <Box
        sx={{
          height: 5,
          width: '100%',
          background: 'linear-gradient(90deg, #4285F4 0%, #EA4335 30%, #FBBC05 65%, #34A853 100%)',
        }}
      />

      <IconButton
        size="small"
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 20,
          color: 'text.secondary',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          '&:hover': {
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center', position: 'relative', zIndex: 5 }}>
        {/* Animated Google Badge Avatar */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2.5 }}>
          {/* Animated Glowing Aura */}
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              right: -8,
              bottom: -8,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
              opacity: 0.6,
              filter: 'blur(8px)',
              animation: 'spinAura 4s linear infinite',
              '@keyframes spinAura': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />

          <Avatar
            src={avatarUrl}
            alt={userName}
            sx={{
              width: 84,
              height: 84,
              fontSize: '2.2rem',
              fontWeight: 700,
              bgcolor: '#1a73e8',
              border: '3px solid #ffffff',
              boxShadow: '0 8px 24px rgba(66, 133, 244, 0.35)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>

          {/* Google Verified Checkmark icon overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              zIndex: 3,
              bgcolor: '#ffffff',
              borderRadius: '50%',
              p: 0.3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex',
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 26, color: '#34A853' }} />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{
            letterSpacing: '-0.02em',
            mb: 0.5,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Google Authentication Successful!
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You have securely signed in via Google OAuth 2.0 with identity validation.
        </Typography>

        {/* User Details Glass Card */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(66, 133, 244, 0.04)',
            border: '1px solid',
            borderColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(66, 133, 244, 0.15)',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left',
          }}
        >
          <Box sx={{ minWidth: 0, pr: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap color="text.primary">
              {userName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {userEmail}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexShrink={0}>
            <Chip
              size="small"
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              }
              label="Google Verified"
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(52, 168, 83, 0.15)' : '#e6f4ea',
                color: '#137333',
                fontWeight: 600,
                fontSize: '0.72rem',
                border: '1px solid rgba(52, 168, 83, 0.3)',
              }}
            />
            <Chip
              size="small"
              label={userData.role || 'User'}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
            />
          </Stack>
        </Box>

        {/* Animated Handshake Pipeline Checklist */}
        <Stack spacing={1.2} sx={{ mb: 3, textAlign: 'left' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              opacity: stepsVisible[0] ? 1 : 0.2,
              transform: stepsVisible[0] ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 18, color: '#34A853' }} />
            <Typography variant="body2" fontWeight={500} color="text.primary">
              Google OAuth 2.0 Token Handshake Confirmed
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              opacity: stepsVisible[1] ? 1 : 0.2,
              transform: stepsVisible[1] ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <ShieldRoundedIcon sx={{ fontSize: 18, color: '#4285F4' }} />
            <Typography variant="body2" fontWeight={500} color="text.primary">
              Cryptographic Session Token Issued & Encrypted
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              opacity: stepsVisible[2] ? 1 : 0.2,
              transform: stepsVisible[2] ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <MarkEmailReadRoundedIcon sx={{ fontSize: 18, color: '#FBBC05' }} />
            <Typography variant="body2" fontWeight={500} color="text.primary">
              {emailStatus?.message || 'Onboarding Notice Dispatched to Gmail Inbox'}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              opacity: stepsVisible[3] ? 1 : 0.2,
              transform: stepsVisible[3] ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18, color: '#a855f7' }} />
            <Typography variant="body2" fontWeight={500} color="text.primary">
              AI Request Triage Assistant Workspace Synced
            </Typography>
          </Box>
        </Stack>

        {/* Auto Transition Progress Bar */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography variant="caption" color="text.secondary">
              Launching Workspace Automatically...
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary.main">
              {countdown > 0 ? `${countdown}s` : 'Ready!'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #4285F4 0%, #1a73e8 50%, #34A853 100%)',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={onEnterWorkspace}
          endIcon={<RocketLaunchIcon />}
          sx={{
            py: 1.3,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '1rem',
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #1a73e8 0%, #4285F4 50%, #3b82f6 100%)',
            boxShadow: '0 8px 20px -4px rgba(66, 133, 244, 0.5)',
            transition: 'all 0.25s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #1557b0 0%, #1a73e8 50%, #2563eb 100%)',
              boxShadow: '0 12px 28px -4px rgba(66, 133, 244, 0.6)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Launch AI Workspace Now
        </Button>
      </DialogContent>
    </Dialog>
  );
}

