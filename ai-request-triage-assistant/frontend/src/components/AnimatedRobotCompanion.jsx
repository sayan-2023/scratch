import React, { useState, useEffect } from 'react';
import { Box, Typography, Tooltip, Zoom } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useColorMode } from '../ThemeContext';

/**
 * AnimatedRobotCompanion ("Nova")
 * An expressive, 3D-styled animated robot companion that floats at the bottom-right
 * of the screen with idle levitation physics, blinking LED visor eyes, glowing
 * anti-gravity propulsion ring, and interactive speech bubbles.
 * Fully adapts colors, materials, and text for Dark and Light modes!
 */
export default function AnimatedRobotCompanion({ onClick, isOpen, hasApiKey = true, mode = 'workspace' }) {
  const { isDark } = useColorMode();
  const isWebsiteGuide = mode === 'website_guide';
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [speechIndex, setSpeechIndex] = useState(0);

  const speechMessages = isWebsiteGuide
    ? [
        "👋 Hi! I'm Nova, your Website Guide! Ask me how this platform works! 🤖",
        "⚡ Want to explore our LangGraph cognitive pipeline & SLAs? Click me! 🧠",
        "🌐 Ask how to test Live Studio, Webhooks, or get started! 💡",
      ]
    : [
        "👋 Hi! I'm Nova, your Multimodal AI Assistant! Ask me anything or drop a screenshot! 🤖",
        "⚡ Grounded in Enterprise SLAs & Routing rules. Click me to explore! 🧠",
        "📸 You can paste (Ctrl+V) or upload error screenshots for instant diagnosis! 🔍",
      ];

  // Periodic blinking eyes animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Periodic speech bubble rotation
  useEffect(() => {
    const speechInterval = setInterval(() => {
      setSpeechIndex((prev) => (prev + 1) % speechMessages.length);
    }, 9000);
    return () => clearInterval(speechInterval);
  }, []);

  if (isOpen) {
    // Hidden while the main chat window is open
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 20, md: 32 },
        right: { xs: 20, md: 32 },
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'auto',
      }}
    >
      {/* Interactive Floating Speech Bubble - Adapts to Dark and Light Mode */}
      {showSpeechBubble && (
        <Zoom in={showSpeechBubble} timeout={500}>
          <Box
            onClick={onClick}
            sx={{
              mb: 1.5,
              mr: 1,
              maxWidth: 280,
              p: 1.8,
              borderRadius: 3.5,
              borderBottomRightRadius: 1,
              background: isDark
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 243, 255, 0.98) 100%)',
              backdropFilter: 'blur(16px)',
              border: isDark
                ? '1px solid rgba(139, 92, 246, 0.45)'
                : '1px solid rgba(168, 85, 247, 0.45)',
              boxShadow: isDark
                ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)'
                : '0 12px 35px rgba(124, 58, 237, 0.22), 0 4px 14px rgba(0, 0, 0, 0.08)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: 'bubbleFloat 4s ease-in-out infinite',
              position: 'relative',
              '&:hover': {
                transform: 'scale(1.04) translateY(-2px)',
                borderColor: isDark ? 'rgba(192, 132, 252, 0.8)' : 'rgba(124, 58, 237, 0.8)',
                boxShadow: isDark
                  ? '0 14px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(168, 85, 247, 0.5)'
                  : '0 16px 40px rgba(124, 58, 237, 0.3), 0 6px 18px rgba(0, 0, 0, 0.1)',
              },
              '@keyframes bubbleFloat': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-6px)' },
              },
            }}
          >
            {/* Top Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                    animation: 'pulseGlow 2s infinite',
                    '@keyframes pulseGlow': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.5, transform: 'scale(1.3)' },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? '#c084fc' : '#7c3aed',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {isWebsiteGuide ? 'Nova • Website Guide' : 'Nova • Multimodal RAG'}
                </Typography>
              </Box>
              <AutoAwesomeIcon sx={{ fontSize: 13, color: isDark ? '#ec4899' : '#db2777' }} />
            </Box>

            {/* Speech Text */}
            <Typography
              variant="body2"
              sx={{
                color: isDark ? '#f1f5f9' : '#0f172a',
                fontSize: '0.82rem',
                lineHeight: 1.45,
                fontWeight: 600,
              }}
            >
              {speechMessages[speechIndex]}
            </Typography>

            {/* Quick Prompt Hint */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                color: isDark ? '#93c5fd' : '#2563eb',
                fontSize: '0.68rem',
                fontWeight: 700,
                textAlign: 'right',
              }}
            >
              Click robot to launch chat ⚡
            </Typography>

            {/* Speech bubble pointer triangle */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -8,
                right: 24,
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: isDark
                  ? '8px solid rgba(30, 27, 75, 0.95)'
                  : '8px solid rgba(245, 243, 255, 0.98)',
              }}
            />
          </Box>
        </Zoom>
      )}

      {/* Interactive Robot Character Avatar - Adapts Shell, Eyes, and Core to Theme */}
      <Tooltip
        title={isWebsiteGuide ? "Click to chat with Nova • Website & Platform Guide" : "Click to chat with Nova • Multimodal RAG Assistant"}
        arrow
        placement="left"
      >
        <Box
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            cursor: 'pointer',
            position: 'relative',
            width: 78,
            height: 84,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: 'robotLevitate 3.2s ease-in-out infinite',
            '&:hover': {
              transform: 'scale(1.12) translateY(-4px)',
            },
            '&:active': {
              transform: 'scale(0.96)',
            },
            '@keyframes robotLevitate': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '25%': { transform: 'translateY(-7px) rotate(1.5deg)' },
              '75%': { transform: 'translateY(4px) rotate(-1.5deg)' },
            },
          }}
        >
          {/* Antenna with Blinking Beacon LED */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Beacon glowing tip */}
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #f43f5e 30%, #ec4899 100%)',
                boxShadow: isHovered
                  ? '0 0 16px #f43f5e, 0 0 24px #ec4899'
                  : '0 0 10px #f43f5e',
                animation: 'beaconPulse 1.6s ease-in-out infinite',
                '@keyframes beaconPulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 0.9 },
                  '50%': { transform: 'scale(1.35)', opacity: 1 },
                },
              }}
            />
            {/* Antenna stem */}
            <Box
              sx={{
                width: 3,
                height: 8,
                backgroundColor: isDark ? '#94a3b8' : '#64748b',
                borderRadius: 1,
              }}
            />
          </Box>

          {/* Robot Head Outer Shell - Ceramic White in Light Mode, Slate Metallic in Dark Mode */}
          <Box
            sx={{
              width: 62,
              height: 48,
              borderRadius: '20px 20px 16px 16px',
              background: isDark
                ? 'linear-gradient(180deg, #334155 0%, #1e293b 100%)'
                : 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
              border: '2px solid',
              borderColor: isHovered
                ? isDark ? '#c084fc' : '#7c3aed'
                : isDark ? '#64748b' : '#94a3b8',
              boxShadow: isHovered
                ? isDark
                  ? '0 8px 24px rgba(139, 92, 246, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                  : '0 10px 26px rgba(124, 58, 237, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.9)'
                : isDark
                  ? '0 6px 18px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
                  : '0 6px 18px rgba(0, 0, 0, 0.12), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Head Ears / Cyber Audio Rings */}
            <Box
              sx={{
                position: 'absolute',
                left: -3,
                width: 4,
                height: 14,
                borderRadius: 2,
                backgroundColor: isDark ? '#8b5cf6' : '#7c3aed',
                boxShadow: isDark ? '0 0 8px #8b5cf6' : '0 0 8px #7c3aed',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                right: -3,
                width: 4,
                height: 14,
                borderRadius: 2,
                backgroundColor: isDark ? '#8b5cf6' : '#7c3aed',
                boxShadow: isDark ? '0 0 8px #8b5cf6' : '0 0 8px #7c3aed',
              }}
            />

            {/* Glowing Digital Visor Screen */}
            <Box
              sx={{
                width: 46,
                height: 28,
                borderRadius: 3,
                backgroundColor: isDark ? '#020617' : '#090d16',
                border: '1.5px solid rgba(56, 189, 248, 0.45)',
                boxShadow: 'inset 0 0 10px rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.2,
                position: 'relative',
              }}
            >
              {/* Left Eye */}
              <Box
                sx={{
                  width: isBlinking ? 8 : (isHovered ? 9 : 8),
                  height: isBlinking ? 2 : (isHovered ? 10 : 8),
                  borderRadius: isBlinking ? 1 : (isHovered ? '4px 4px 6px 6px' : '50%'),
                  backgroundColor: '#00e5ff',
                  boxShadow: '0 0 10px #00e5ff, 0 0 18px rgba(0, 229, 255, 0.8)',
                  transition: 'all 0.12s ease',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              />

              {/* Right Eye */}
              <Box
                sx={{
                  width: isBlinking ? 8 : (isHovered ? 9 : 8),
                  height: isBlinking ? 2 : (isHovered ? 10 : 8),
                  borderRadius: isBlinking ? 1 : (isHovered ? '4px 4px 6px 6px' : '50%'),
                  backgroundColor: '#00e5ff',
                  boxShadow: '0 0 10px #00e5ff, 0 0 18px rgba(0, 229, 255, 0.8)',
                  transition: 'all 0.12s ease',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              />

              {/* Subtle Scanline Effect on Screen */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 3,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(56, 189, 248, 0.08) 3px, rgba(56, 189, 248, 0.08) 4px)',
                  pointerEvents: 'none',
                }}
              />
            </Box>
          </Box>

          {/* Torso with Pulsing Arc Reactor Core */}
          <Box
            sx={{
              width: 38,
              height: 20,
              borderRadius: '0 0 14px 14px',
              background: isDark
                ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                : 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
              border: isDark ? '1.5px solid #475569' : '1.5px solid #94a3b8',
              borderTop: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: -0.5,
              position: 'relative',
            }}
          >
            {/* Mini Arc Reactor Core */}
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #a855f7 20%, #3b82f6 80%)',
                boxShadow: isDark
                  ? '0 0 10px #a855f7, 0 0 18px #3b82f6'
                  : '0 0 8px #a855f7, 0 0 14px #3b82f6',
                animation: 'coreSpin 3s linear infinite',
                '@keyframes coreSpin': {
                  '0%': { transform: 'rotate(0deg) scale(1)' },
                  '50%': { transform: 'rotate(180deg) scale(1.15)' },
                  '100%': { transform: 'rotate(360deg) scale(1)' },
                },
              }}
            />
          </Box>

          {/* Anti-Gravity Propulsion Ring / Shadow underneath */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -10,
              width: 44,
              height: 8,
              borderRadius: '50%',
              background: isDark
                ? 'radial-gradient(ellipse, rgba(139, 92, 246, 0.6) 0%, rgba(56, 189, 248, 0.3) 50%, transparent 80%)'
                : 'radial-gradient(ellipse, rgba(124, 58, 237, 0.4) 0%, rgba(37, 99, 235, 0.2) 50%, transparent 80%)',
              filter: 'blur(3px)',
              animation: 'thrusterPulse 3.2s ease-in-out infinite',
              '@keyframes thrusterPulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
                '25%': { transform: 'scale(0.8)', opacity: 0.4 },
                '75%': { transform: 'scale(1.25)', opacity: 0.85 },
              },
            }}
          />
        </Box>
      </Tooltip>
    </Box>
  );
}
