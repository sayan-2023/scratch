import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Grid,
  Snackbar,
  Alert,
  Fade,
} from '@mui/material';

import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import EmailSettingsModal from './components/EmailSettingsModal';
import SamplePicker from './components/SamplePicker';
import RequestInput from './components/RequestInput';
import TriageResultCard from './components/TriageResultCard';
import HistorySidebar from './components/HistorySidebar';

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Email accounts configuration
  const [emailAccounts, setEmailAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('gmail_accounts_config');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [simulationMode, setSimulationMode] = useState(() => {
    return localStorage.getItem('gmail_simulation_mode') === 'true';
  });

  const [samples, setSamples] = useState([]);
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [requestText, setRequestText] = useState('');

  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // Initial load: check health and fetch sample mock requests
  useEffect(() => {
    checkBackendHealth();
    fetchSamples();
    fetchBackendEmailConfig();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        setBackendOnline(true);
        setHasEnvKey(Boolean(data.has_configured_api_key));
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  const fetchBackendEmailConfig = async () => {
    try {
      const res = await fetch('/api/email/config');
      if (res.ok) {
        const data = await res.json();
        if (data.configured_accounts && data.configured_accounts.length > 0 && emailAccounts.length === 0) {
          // If user hasn't set any in localStorage, populate from server
          setEmailAccounts(data.configured_accounts);
        }
      }
    } catch (err) {
      console.warn('Could not fetch server email config:', err);
    }
  };

  const fetchSamples = async () => {
    try {
      const res = await fetch('/api/samples');
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
      }
    } catch (err) {
      console.warn('Could not fetch mock samples:', err);
    }
  };

  const handleSaveKey = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('gemini_api_key', newKey);
      setToast({ open: true, message: 'Gemini API key saved to browser storage.', severity: 'success' });
    } else {
      localStorage.removeItem('gemini_api_key');
      setToast({ open: true, message: 'Gemini API key removed.', severity: 'info' });
    }
  };

  const handleSaveEmailAccounts = (accounts) => {
    setEmailAccounts(accounts);
    localStorage.setItem('gmail_accounts_config', JSON.stringify(accounts));
    setToast({
      open: true,
      message: `Saved ${accounts.length} Gmail dispatcher account${accounts.length === 1 ? '' : 's'}.`,
      severity: 'success',
    });
  };

  const handleToggleSimulationMode = (enabled) => {
    setSimulationMode(enabled);
    localStorage.setItem('gmail_simulation_mode', enabled.toString());
    setToast({
      open: true,
      message: enabled
        ? 'Safe Simulation Mode enabled (no actual emails will be sent).'
        : 'Live Delivery Mode enabled (emails will be sent via Gmail SMTP).',
      severity: 'info',
    });
  };

  const handleSelectSample = (sample) => {
    setActiveSampleId(sample.id);
    setRequestText(sample.text);
    setActiveHistoryIndex(-1);
  };

  const handleClear = () => {
    setRequestText('');
    setActiveSampleId(null);
    setCurrentResult(null);
    setActiveHistoryIndex(-1);
  };

  const handleTriage = async () => {
    if (!requestText.trim()) return;

    if (!apiKey && !hasEnvKey) {
      setIsKeyModalOpen(true);
      setToast({
        open: true,
        message: 'Please provide a Google Gemini API key to proceed.',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        request_text: requestText.trim(),
        api_key: apiKey || undefined,
      };

      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to triage request.');
      }

      setCurrentResult(data);
      setHistory((prev) => [{ text: requestText, result: data, timestamp: new Date() }, ...prev]);
      setActiveHistoryIndex(0);
      setToast({
        open: true,
        message: `Triage complete! Routed to ${data.assigned_owner} with ${data.priority} priority.`,
        severity: 'success',
      });
    } catch (err) {
      setToast({
        open: true,
        message: err.message || 'An unexpected error occurred during triage.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (payload) => {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || 'Failed to transmit email.');
    }

    setToast({
      open: true,
      message: data.is_simulation
        ? `Response transmitted (Simulation Mode) to ${data.sent_to.join(', ')}!`
        : `Email successfully transmitted to ${data.sent_to.join(', ')} via ${data.sent_from}!`,
      severity: 'success',
    });

    return data;
  };

  const handleSelectHistoryItem = (index) => {
    const item = history[index];
    if (item) {
      setActiveHistoryIndex(index);
      setRequestText(item.text);
      setCurrentResult(item.result);
      setActiveSampleId(null);
    }
  };

  const activeSample = samples.find((s) => s.id === activeSampleId);
  const effectiveHasKey = Boolean(apiKey || hasEnvKey);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 8 }}>
      <Header
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        hasApiKey={effectiveHasKey}
        backendOnline={backendOnline}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        emailAccountsCount={emailAccounts.length}
        simulationMode={simulationMode}
      />

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Main Triage Section */}
          <Grid item xs={12} lg={8.5}>
            {/* 1-Click Mock Scenarios */}
            {samples.length > 0 && (
              <SamplePicker
                samples={samples}
                onSelectSample={handleSelectSample}
                selectedId={activeSampleId}
              />
            )}

            {/* Input Area */}
            <RequestInput
              requestText={requestText}
              onChangeText={setRequestText}
              onTriage={handleTriage}
              loading={loading}
              onClear={handleClear}
              activeSample={activeSample}
              hasApiKey={effectiveHasKey}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
            />

            {/* Output Result Card */}
            {currentResult && (
              <Fade in={Boolean(currentResult)}>
                <Box sx={{ mt: 3 }}>
                  <TriageResultCard
                    result={currentResult}
                    onSendEmail={handleSendEmail}
                    accounts={emailAccounts}
                    simulationMode={simulationMode}
                    onOpenEmailModal={() => setIsEmailModalOpen(true)}
                  />
                </Box>
              </Fade>
            )}
          </Grid>

          {/* Activity Log / History Sidebar */}
          <Grid item xs={12} lg={3.5}>
            <HistorySidebar
              history={history}
              onSelectHistoryItem={handleSelectHistoryItem}
              activeIndex={activeHistoryIndex}
            />
          </Grid>
        </Grid>
      </Container>

      {/* API Key Modal */}
      <ApiKeyModal
        open={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveKey}
        hasEnvKey={hasEnvKey}
      />

      {/* Gmail Accounts Configuration Modal */}
      <EmailSettingsModal
        open={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        accounts={emailAccounts}
        onSaveAccounts={handleSaveEmailAccounts}
        simulationMode={simulationMode}
        onToggleSimulationMode={handleToggleSimulationMode}
      />

      {/* Feedback Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
