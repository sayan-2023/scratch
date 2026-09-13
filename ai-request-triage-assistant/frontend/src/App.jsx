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
import InboxFeedModal from './components/InboxFeedModal';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import AnimatedRobotCompanion from './components/AnimatedRobotCompanion';
import MultimodalRagChatModal from './components/MultimodalRagChatModal';
import { useColorMode } from './ThemeContext';

export default function App() {
  const { isDark } = useColorMode();
  const [isRagChatOpen, setIsRagChatOpen] = useState(false);
  // Navigation / View state: 'landing' or 'workspace'
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('triage_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    // If already signed in, go directly to workspace; otherwise show marketing landing page
    return localStorage.getItem('triage_user') ? 'workspace' : 'landing';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // API Key & Backend status
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

  // Dynamic Samples state (Scenario A & B)
  const [samples, setSamples] = useState([]);
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [requestText, setRequestText] = useState('');
  const [generatingAiSample, setGeneratingAiSample] = useState(false);

  // Inbound Live Feed / Webhook state (Scenario C)
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [inboxMessages, setInboxMessages] = useState([]);

  // Triage state & Persistent History across logouts
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // Initial load
  useEffect(() => {
    checkBackendHealth();
    fetchSamples();
    fetchBackendEmailConfig();
    fetchInboxMessages();

    // If user is logged in, load their persistent history from the backend
    if (currentUser?.id) {
      fetchUserHistory(currentUser.id);
    }
  }, [currentUser?.id]);

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

  const fetchInboxMessages = async () => {
    try {
      const res = await fetch('/api/inbox');
      if (res.ok) {
        const data = await res.json();
        setInboxMessages(data);
      }
    } catch (err) {
      console.warn('Could not fetch inbound messages:', err);
    }
  };

  // Persistent Cross-Session History
  const fetchUserHistory = async (userId) => {
    try {
      const res = await fetch(`/api/history?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        // Format to match HistorySidebar structure
        const formatted = data.map((item) => ({
          text: item.text,
          result: item.result,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(formatted);
      }
    } catch (err) {
      console.warn('Could not fetch persistent history:', err);
    }
  };

  const saveTriageToPersistentHistory = async (text, result) => {
    const userId = currentUser?.id || 'usr-admin-01';
    try {
      await fetch(`/api/history?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, result }),
      });
    } catch (err) {
      console.warn('Could not persist triage history to server:', err);
    }
  };

  // Authentication Handlers
  const handleLoginSuccess = (user, token, emailStatus, isNewUser) => {
    setCurrentUser(user);
    localStorage.setItem('triage_user', JSON.stringify(user));
    localStorage.setItem('triage_token', token);
    setCurrentView('workspace');
    fetchUserHistory(user.id);

    let welcomeToast = isNewUser
      ? `Welcome to AI Request Triage, ${user.name}! Account created.`
      : `Welcome back, ${user.name}! Authenticated as ${user.role}.`;

    if (emailStatus?.message) {
      welcomeToast += ` ${emailStatus.message}`;
    }

    setToast({
      open: true,
      message: welcomeToast,
      severity: 'success',
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('triage_user');
    localStorage.removeItem('triage_token');
    setCurrentView('landing');
    setToast({
      open: true,
      message: 'You have been safely logged out. Your session history is saved securely.',
      severity: 'info',
    });
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

  const handleSaveEmailAccounts = async (accounts) => {
    setEmailAccounts(accounts);
    localStorage.setItem('gmail_accounts_config', JSON.stringify(accounts));

    // Persist to backend server store as well
    try {
      await fetch('/api/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
      });
    } catch (err) {
      console.warn('Could not persist accounts to server:', err);
    }

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
  };

  // Scenario A: AI Generate New Scenario
  const handleGenerateAiSample = async ({ category, industry }) => {
    setGeneratingAiSample(true);
    try {
      const res = await fetch('/api/samples/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || null,
          industry: industry || null,
          api_key: apiKey || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to generate AI scenario.');
      }

      setSamples((prev) => [data, ...prev.filter((s) => s.id !== data.id)]);
      setActiveSampleId(data.id);
      setRequestText(data.text);
      setToast({
        open: true,
        message: `✨ AI generated scenario: "${data.title}"`,
        severity: 'success',
      });
    } catch (err) {
      setToast({
        open: true,
        message: err.message || 'Error generating AI scenario.',
        severity: 'error',
      });
    } finally {
      setGeneratingAiSample(false);
    }
  };

  // Scenario B: Create Custom Preset
  const handleCreateCustomSample = async (payload) => {
    try {
      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save custom preset.');
      }

      setSamples((prev) => [data, ...prev]);
      setActiveSampleId(data.id);
      setRequestText(data.text);
      setToast({
        open: true,
        message: `Custom preset "${data.title}" saved!`,
        severity: 'success',
      });
    } catch (err) {
      setToast({
        open: true,
        message: err.message || 'Error saving custom preset.',
        severity: 'error',
      });
    }
  };

  // Scenario B: Delete Preset
  const handleDeleteSample = async (sampleId) => {
    try {
      const res = await fetch(`/api/samples/${sampleId}`, { method: 'DELETE' });
      if (res.ok) {
        setSamples((prev) => prev.filter((s) => s.id !== sampleId));
        if (activeSampleId === sampleId) {
          setActiveSampleId(null);
        }
        setToast({ open: true, message: 'Scenario preset removed.', severity: 'info' });
      }
    } catch (err) {
      setToast({ open: true, message: 'Could not delete preset.', severity: 'error' });
    }
  };

  // Scenario B: Reset Presets
  const handleResetSamples = async () => {
    try {
      const res = await fetch('/api/samples/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
        setActiveSampleId(null);
        setToast({ open: true, message: 'Presets restored to the 5 default scenarios.', severity: 'info' });
      }
    } catch (err) {
      setToast({ open: true, message: 'Could not reset presets.', severity: 'error' });
    }
  };

  // Scenario C: Simulate Inbound Webhook Event
  const handleSimulateEvent = async (scenarioType) => {
    try {
      const res = await fetch('/api/inbox/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_type: scenarioType,
          auto_triage: false,
          api_key: apiKey || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Simulation failed.');
      }

      setInboxMessages((prev) => [data, ...prev]);
      setToast({
        open: true,
        message: `Received simulated event from ${data.source}!`,
        severity: 'info',
      });
    } catch (err) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Scenario C: Delete Inbox Message
  const handleDeleteInboxMessage = async (itemId) => {
    try {
      const res = await fetch(`/api/inbox/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setInboxMessages((prev) => prev.filter((m) => m.id !== itemId));
      }
    } catch (err) {
      setToast({ open: true, message: 'Could not delete message.', severity: 'error' });
    }
  };

  // Scenario C: Clear Inbox
  const handleClearInbox = async () => {
    try {
      const res = await fetch('/api/inbox', { method: 'DELETE' });
      if (res.ok) {
        setInboxMessages([]);
        setToast({ open: true, message: 'Inbound queue cleared.', severity: 'info' });
      }
    } catch (err) {
      setToast({ open: true, message: 'Could not clear queue.', severity: 'error' });
    }
  };

  // Scenario C: Load Inbound Message into Triage Workspace
  const handleLoadIntoTriage = (inboxMsg) => {
    setRequestText(inboxMsg.body);
    setActiveSampleId(null);
    if (inboxMsg.triage_result) {
      setCurrentResult(inboxMsg.triage_result);
    }
    setIsInboxModalOpen(false);
    setToast({
      open: true,
      message: `Loaded inquiry from ${inboxMsg.sender} into triage workspace.`,
      severity: 'info',
    });
  };

  // Triage flow
  const handleTriage = async () => {
    if (!requestText.trim() || requestText.trim().length < 5) {
      setToast({
        open: true,
        message: 'Please provide at least 5 characters of request text.',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    setCurrentResult(null);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_text: requestText.trim(),
          api_key: apiKey || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Triage execution failed on backend.');
      }

      setCurrentResult(data);
      setHistory((prev) => [{ text: requestText, result: data, timestamp: new Date() }, ...prev]);
      setActiveHistoryIndex(0);

      // Persist to server store for cross-session access
      await saveTriageToPersistentHistory(requestText, data);

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

  // VIEW 1: LANDING PAGE (Animated Marketing Home)
  if (currentView === 'landing') {
    return (
      <Box>
        <LandingPage
          onLaunchWorkspace={() => setCurrentView('workspace')}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenRagChat={() => setIsRagChatOpen(true)}
          isRagChatOpen={isRagChatOpen}
          onCloseRagChat={() => setIsRagChatOpen(false)}
          apiKey={apiKey}
        />

        {/* Auth Modal */}
        <AuthModal
          open={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          emailAccounts={emailAccounts}
        />
      </Box>
    );
  }

  // VIEW 2: LIVE WORKSPACE DASHBOARD
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#080c14' : '#f8fafc',
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(59, 130, 246, 0.12), transparent 70%), radial-gradient(ellipse 50% 30% at 85% 15%, rgba(139, 92, 246, 0.1), transparent 60%)'
          : 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(99, 102, 241, 0.08), transparent 70%), radial-gradient(ellipse 50% 30% at 85% 15%, rgba(236, 72, 153, 0.05), transparent 60%)',
        backgroundAttachment: 'fixed',
        pb: 8,
        transition: 'background-color 0.3s ease',
        overflowX: 'hidden',
      }}
    >
      <Header
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        hasApiKey={effectiveHasKey}
        backendOnline={backendOnline}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        emailAccountsCount={emailAccounts.length}
        simulationMode={simulationMode}
        onOpenInboxModal={() => setIsInboxModalOpen(true)}
        inboxCount={inboxMessages.length}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onNavigateHome={() => setCurrentView('landing')}
      />

      <Container maxWidth="xl" sx={{ mt: 3.5, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3}>
          {/* Main Triage Section */}
          <Grid
            item
            xs={12}
            lg={8.5}
            sx={{
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(16px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* Scenario Presets (Scenario A & B) */}
            <SamplePicker
              samples={samples}
              onSelectSample={handleSelectSample}
              selectedId={activeSampleId}
              onGenerateAiSample={handleGenerateAiSample}
              onCreateCustomSample={handleCreateCustomSample}
              onDeleteSample={handleDeleteSample}
              onResetSamples={handleResetSamples}
              generatingAi={generatingAiSample}
              hasApiKey={effectiveHasKey}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
            />

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
              onSaveAsPreset={handleCreateCustomSample}
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

          {/* Persistent Activity Log / History Sidebar Across Logouts */}
          <Grid
            item
            xs={12}
            lg={3.5}
            sx={{
              animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both',
            }}
          >
            <HistorySidebar
              history={history}
              onSelectHistoryItem={handleSelectHistoryItem}
              activeIndex={activeHistoryIndex}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Live Inbound & Webhooks Feed Modal (Scenario C) */}
      <InboxFeedModal
        open={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        inboxMessages={inboxMessages}
        onSimulateEvent={handleSimulateEvent}
        onDeleteMessage={handleDeleteInboxMessage}
        onClearInbox={handleClearInbox}
        onLoadIntoTriage={handleLoadIntoTriage}
      />

      {/* Authentication Modal */}
      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        emailAccounts={emailAccounts}
      />

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

      {/* Floating Animated Robot Companion (Nova - Inside Workspace Copilot) */}
      <AnimatedRobotCompanion
        onClick={() => setIsRagChatOpen(true)}
        isOpen={isRagChatOpen}
        hasApiKey={effectiveHasKey}
        mode="workspace"
      />

      {/* Multimodal RAG Chat Modal (Inside Workspace Copilot) */}
      <MultimodalRagChatModal
        open={isRagChatOpen}
        onClose={() => setIsRagChatOpen(false)}
        apiKey={apiKey}
        mode="workspace"
      />
    </Box>
  );
}
