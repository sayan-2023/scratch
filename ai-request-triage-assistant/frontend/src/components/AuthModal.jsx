import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Tabs,
  Tab,
  Alert,
  Divider,
  Stack,
  InputAdornment,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';

const calculatePasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '#94a3b8' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
  if (score === 3) return { score: 3, label: 'Strong', color: '#3b82f6' };
  return { score: 4, label: 'Enterprise Grade', color: '#10b981' };
};

const getDomainBadge = (emailStr) => {
  if (!emailStr || !emailStr.includes('@')) return null;
  const domain = emailStr.split('@')[1]?.toLowerCase().trim();
  if (!domain || !domain.includes('.')) return null;
  const commonPersonal = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  if (commonPersonal.includes(domain)) {
    return { label: 'Personal Workspace', color: '#64748b', isEnterprise: false };
  }
  return { label: `✓ Enterprise Domain: ${domain}`, color: '#059669', isEnterprise: true };
};

export default function AuthModal({
  open,
  onClose,
  onLoginSuccess,
  emailAccounts = [],
}) {
  const [tab, setTab] = useState(0); // 0: Sign In, 1: Register
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Request code, 2: Reset password

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleClose = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsForgotPassword(false);
    setResetStep(1);
    setIsCodeVerified(false);
    setVerifyingCode(false);
    setResetCode('');
    setNewPassword('');
    onClose();
  };

  // 1-Click Admin Quick Login Fill
  const handleFillAdmin = () => {
    setEmail('admin@triage.ai');
    setPassword('AdminPassword123!');
    setErrorMsg('');
    setSuccessMsg('Admin credentials autofilled. Click "Sign In to Workspace" below.');
  };

  // Handle Sign In
  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email or user ID and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_or_username: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to sign in. Please verify your credentials.');
      }

      setSuccessMsg(data.message);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        handleClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          accounts: emailAccounts && emailAccounts.length > 0 ? emailAccounts : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }

      let displayMsg = data.message;
      if (data.email_status?.message && !displayMsg.includes(data.email_status.message)) {
        displayMsg += ` (${data.email_status.message})`;
      }
      setSuccessMsg(displayMsg);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token, data.email_status, data.is_new_user);
        handleClose();
      }, 900);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process OAuth Handshake from Google Popup
  const handleGoogleOAuthPayload = async (payload) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('Verifying Google OAuth 2.0 credentials...');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          name: payload.name,
          password: payload.password,
          google_id: payload.google_id,
          avatar_url: payload.avatar_url,
          id_token: payload.id_token,
          verified_email: payload.verified_email,
          accounts: emailAccounts && emailAccounts.length > 0 ? emailAccounts : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Google OAuth verification failed.');
      }

      let displayMsg = data.message;
      if (data.email_status?.message && !displayMsg.includes(data.email_status.message)) {
        displayMsg += ` (${data.email_status.message})`;
      }
      setSuccessMsg(displayMsg);

      setTimeout(() => {
        onLoginSuccess(data.user, data.token, data.email_status, data.is_new_user, {
          isGoogleOAuth: true,
          googleId: payload.google_id,
        });
        handleClose();
      }, 400);
    } catch (err) {
      setErrorMsg(err.message || 'Google OAuth authentication failed.');
      setLoading(false);
    }
  };

  // Launch Traditional Google OAuth Popup
  const handleOpenGooglePrompt = () => {
    setErrorMsg('');
    setSuccessMsg('');

    const width = 500;
    const height = 620;
    const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));

    const prefillEmail = email.trim();
    const popupUrl = prefillEmail
      ? `/oauth-google.html?email=${encodeURIComponent(prefillEmail)}`
      : '/oauth-google.html';

    const popup = window.open(
      popupUrl,
      'GoogleOAuthWindow',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,location=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setErrorMsg('Google OAuth popup was blocked by your browser. Please allow popups for this site and try again.');
      return;
    }

    setLoading(true);
    setSuccessMsg('Waiting for Google authorization in popup window...');

    const messageHandler = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        window.removeEventListener('message', messageHandler);
        if (closedPoll) clearInterval(closedPoll);
        await handleGoogleOAuthPayload(event.data.payload);
      }
    };

    window.addEventListener('message', messageHandler);

    // Poll for user closing popup without authenticating
    const closedPoll = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedPoll);
        window.removeEventListener('message', messageHandler);
        setLoading(false);
      }
    }, 800);
  };

  // Handle Forgot Password Request Code
  const handleRequestResetCode = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsCodeVerified(false);
    setResetCode('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          accounts: emailAccounts && emailAccounts.length > 0 ? emailAccounts : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not send verification code.');
      }

      // DO NOT autofill code into input box: user must check email and type it in
      setResetCode('');
      let msg = data.message || `A 6-digit verification code has been dispatched to ${email.trim()}! Please check your email.`;
      if (data.email_status?.is_simulation) {
        msg += ' (Safe demo mode: configure a Gmail App Password in Configure Gmail to receive live emails in your personal inbox).';
      }
      setSuccessMsg(msg);
      setResetStep(2);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify Code
  const handleVerifyCode = async () => {
    // Extract numeric digits, or fallback to trimmed input
    const numericCode = resetCode.replace(/[^0-9]/g, '');
    const codeToVerify = numericCode.length === 6 ? numericCode : resetCode.trim();

    if (!codeToVerify) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setVerifyingCode(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          reset_code: codeToVerify,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid verification code. Please check your email or request a new code.');
      }

      setIsCodeVerified(true);
      setSuccessMsg(data.message || 'Verification code confirmed! You may now set your new password.');
    } catch (err) {
      setIsCodeVerified(false);
      setErrorMsg(err.message);
    } finally {
      setVerifyingCode(false);
    }
  };

  // Handle Confirm Reset Password
  const handleConfirmReset = async (e) => {
    if (e) e.preventDefault();
    if (!isCodeVerified) {
      setErrorMsg('Please verify the verification code first by clicking "Verify Code".');
      return;
    }
    const numericCode = resetCode.replace(/[^0-9]/g, '');
    const codeToSubmit = numericCode.length === 6 ? numericCode : resetCode.trim();

    if (!codeToSubmit || !newPassword.trim()) {
      setErrorMsg('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          reset_code: codeToSubmit,
          new_password: newPassword.trim(),
          accounts: emailAccounts && emailAccounts.length > 0 ? emailAccounts : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Password reset failed.');
      }

      let successMsgText = data.message || 'Congratulations! Your new password has been successfully updated.';
      if (data.email_status?.message && !successMsgText.includes(data.email_status.message)) {
        successMsgText += ` (${data.email_status.message})`;
      }
      setSuccessMsg(successMsgText);

      setTimeout(() => {
        setIsForgotPassword(false);
        setResetStep(1);
        setIsCodeVerified(false);
        setResetCode('');
        setPassword(newPassword);
        setTab(0);
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 20px 40px -8px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.1)'
                : '0 20px 35px -10px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(37, 99, 235, 0.1)',
                color: 'primary.main',
              }}
            >
              <SecurityIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              {isForgotPassword ? 'Reset Password' : tab === 0 ? 'Sign In' : 'Create Account'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 3,
            backgroundColor: 'background.paper',
            borderColor: 'divider',
          }}
        >
        {/* Alerts */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            {successMsg}
          </Alert>
        )}

        {/* FORGOT PASSWORD WORKFLOW */}
        {isForgotPassword ? (
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              size="small"
              onClick={() => {
                setIsForgotPassword(false);
                setResetStep(1);
                setIsCodeVerified(false);
                setResetCode('');
                setNewPassword('');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              sx={{ mb: 2, textTransform: 'none' }}
            >
              Back to Sign In
            </Button>

            {resetStep === 1 ? (
              <Box component="form" onSubmit={handleRequestResetCode}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter your registered email address to receive a 6-digit security verification code:
                </Typography>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <VpnKeyIcon />}
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleConfirmReset}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter the 6-digit code sent to <strong>{email}</strong>:
                </Typography>

                {/* 6-Digit Code Input with adjacent Verify Code button */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
                  <TextField
                    label="6-Digit Verification Code"
                    size="small"
                    fullWidth
                    value={resetCode}
                    onChange={(e) => {
                      setResetCode(e.target.value);
                      if (isCodeVerified) setIsCodeVerified(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isCodeVerified && resetCode.trim()) {
                          handleVerifyCode();
                        }
                      }
                    }}
                    disabled={loading || verifyingCode}
                    placeholder="e.g. 123456"
                    inputProps={{ maxLength: 20 }}
                    helperText={
                      isCodeVerified
                        ? '✓ Code verified successfully'
                        : 'Type the 6-digit code from your email and click Verify'
                    }
                    FormHelperTextProps={{
                      sx: {
                        color: isCodeVerified ? 'success.main' : 'text.secondary',
                        fontWeight: isCodeVerified ? 600 : 400,
                      },
                    }}
                  />
                  <Button
                    variant={isCodeVerified ? 'contained' : 'outlined'}
                    color={isCodeVerified ? 'success' : 'primary'}
                    onClick={handleVerifyCode}
                    disabled={loading || verifyingCode || isCodeVerified || !resetCode.trim()}
                    sx={{
                      height: 40,
                      whiteSpace: 'nowrap',
                      textTransform: 'none',
                      fontWeight: 600,
                      minWidth: '115px',
                    }}
                    startIcon={
                      verifyingCode ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : isCodeVerified ? (
                        <CheckCircleIcon />
                      ) : (
                        <VpnKeyIcon />
                      )
                    }
                  >
                    {isCodeVerified ? 'Verified' : verifyingCode ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </Box>

                {/* Only display and enable password fields once code is verified */}
                {isCodeVerified ? (
                  <Box sx={{ mt: 1 }}>
                    <Alert severity="success" sx={{ mb: 2, fontSize: '0.82rem' }}>
                      Verification code confirmed! You can now set your new password below.
                    </Alert>
                    <TextField
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      size="small"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      sx={{ mb: 2 }}
                      placeholder="At least 6 characters"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading || !newPassword.trim()}
                      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon />}
                    >
                      {loading ? 'Updating Password...' : 'Confirm New Password'}
                    </Button>
                  </Box>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                      borderColor: 'divider',
                      borderRadius: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Please enter the verification code sent to your email and click <strong>Verify Code</strong> beside the text box to unlock password reset.
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        ) : (
          /* STANDARD SIGN IN / REGISTER TABS */
          <Box>
  

            {/* Google OAuth Button */}
            <Button
              variant="outlined"
              fullWidth
              onClick={handleOpenGooglePrompt}
              disabled={loading}
              startIcon={
                <svg width="18" height="18" viewBox="0 0 24 24">
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
              sx={{
                py: 1.1,
                mb: 2,
                color: 'text.primary',
                borderColor: 'divider',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'action.hover',
                },
              }}
            >
              Continue with Google / Gmail
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                OR CONTINUE WITH EMAIL
              </Typography>
            </Divider>

            <Tabs
              value={tab}
              onChange={(e, val) => {
                setTab(val);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              variant="fullWidth"
              sx={{
                mb: 2.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                },
              }}
            >
              <Tab label="Sign In" />
              <Tab label="Create Account" />
            </Tabs>

            {/* TAB 0: SIGN IN */}
            {tab === 0 && (
              <Box component="form" onSubmit={handleSignIn}>
                <TextField
                  label="Email or User ID"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    size="small"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setResetStep(1);
                      setIsCodeVerified(false);
                      setResetCode('');
                      setNewPassword('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    sx={{ textTransform: 'none', fontSize: '0.78rem' }}
                  >
                    Forgot password?
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}
                  sx={{
                    py: 1.2,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                </Button>
              </Box>
            )}

            {/* TAB 1: REGISTER */}
            {tab === 1 && (
              <Box component="form" onSubmit={handleRegister}>
                <TextField
                  label="Full Name"
                  fullWidth
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Corporate Email"
                  type="email"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 1.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                {email && email.includes('@') && (
                  <Box sx={{ mt: -0.5, mb: 1.5 }}>
                    {(() => {
                      const badge = getDomainBadge(email);
                      if (!badge) return null;
                      return (
                        <Chip
                          size="small"
                          label={badge.label}
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? (badge.isEnterprise ? 'rgba(5, 150, 105, 0.2)' : 'rgba(255, 255, 255, 0.06)')
                                : (badge.isEnterprise ? '#ecfdf5' : '#f1f5f9'),
                            color: badge.color,
                            border: '1px solid',
                            borderColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? (badge.isEnterprise ? 'rgba(5, 150, 105, 0.4)' : 'divider')
                                : (badge.isEnterprise ? '#a7f3d0' : '#cbd5e1'),
                          }}
                        />
                      );
                    })()}
                  </Box>
                )}

                <TextField
                  label="Password (min 6 chars)"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {password && (
                  <Box sx={{ mb: 2 }}>
                    {(() => {
                      const strength = calculatePasswordStrength(password);
                      return (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Password Strength:
                            </Typography>
                            <Typography variant="caption" sx={{ color: strength.color, fontWeight: 700, fontSize: '0.72rem' }}>
                              {strength.label}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            {[1, 2, 3, 4].map((level) => (
                              <Box
                                key={level}
                                sx={{
                                  height: 4,
                                  flexGrow: 1,
                                  borderRadius: 1,
                                  backgroundColor: (theme) =>
                                    level <= strength.score
                                      ? strength.color
                                      : theme.palette.mode === 'dark'
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : '#e2e8f0',
                                  transition: 'all 0.2s ease',
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      );
                    })()}
                  </Box>
                )}

                <TextField
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  size="small"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonOutlineIcon />}
                  sx={{
                    py: 1.2,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account & Sign In'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

