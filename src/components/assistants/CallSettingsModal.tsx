'use client';

import { useState, useEffect } from 'react';
import { X, Phone, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { RetellAgent } from '@/lib/retell';

interface CallSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: RetellAgent;
  agentId?: string;
  onSave?: (settings: any) => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function CallSettingsModal({ isOpen, onClose, agent, agentId, onSave }: CallSettingsModalProps) {
  // Data Storage
  const [dataStorageSetting, setDataStorageSetting] = useState('everything');
  const [optInSignedUrl, setOptInSignedUrl] = useState(false);

  // Call Duration
  const [maxCallTime, setMaxCallTime] = useState(60);
  const [silenceTimeout, setSilenceTimeout] = useState(10);
  const [ringDuration, setRingDuration] = useState(90);

  // Background
  const [backgroundNoise, setBackgroundNoise] = useState<string | null>(null);
  const [backgroundVolume, setBackgroundVolume] = useState(1);

  // Engagement
  const [rulesOfEngagement, setRulesOfEngagement] = useState('ai-starts-dynamic');
  const [beginMessage, setBeginMessage] = useState('');
  const [beginMessageDelay, setBeginMessageDelay] = useState(0);

  // Speech Settings
  const [responsiveness, setResponsiveness] = useState(1);
  const [interruptionSensitivity, setInterruptionSensitivity] = useState(1);
  const [enableBackchanneling, setEnableBackchanneling] = useState(false);
  const [backchannelFrequency, setBackchannelFrequency] = useState(0.8);
  const [enableSpeechNormalization, setEnableSpeechNormalization] = useState(false);
  const [reminderTrigger, setReminderTrigger] = useState(10);
  const [reminderMaxCount, setReminderMaxCount] = useState(1);

  // DTMF Settings
  const [allowUserDtmf, setAllowUserDtmf] = useState(true);
  const [dtmfTimeout, setDtmfTimeout] = useState(4);
  const [dtmfTerminationKey, setDtmfTerminationKey] = useState('#');
  const [dtmfDigitLimit, setDtmfDigitLimit] = useState(25);

  // Webhook & Voicemail
  const [voicemailDetection, setVoicemailDetection] = useState(false);
  const [voicemailAction, setVoicemailAction] = useState<'hangup' | 'static_text' | 'prompt'>('hangup');
  const [voicemailMessage, setVoicemailMessage] = useState('');
  const [incomingWebhook, setIncomingWebhook] = useState('');
  const [webhookTimeout, setWebhookTimeout] = useState(10000);
  
  // Additional Settings
  const [boostedKeywords, setBoostedKeywords] = useState('');
  const [denoisingMode, setDenoisingMode] = useState('noise-cancellation');

  // Accordion states - all open by default
  const [expandedSections, setExpandedSections] = useState({
    dataStorage: true,
    callDuration: true,
    background: true,
    engagement: true,
    speech: true,
    dtmf: true,
    webhook: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (agent) {
      setDataStorageSetting(agent.data_storage_setting || 'everything');
      setOptInSignedUrl(agent.opt_in_signed_url || false);
      setMaxCallTime(agent.max_call_duration_ms ? Math.floor(agent.max_call_duration_ms / 60000) : 60);
      setSilenceTimeout(agent.end_call_after_silence_ms ? Math.floor(agent.end_call_after_silence_ms / 60000) : 10);
      setRingDuration(agent.ring_duration_ms ? Math.floor(agent.ring_duration_ms / 1000) : 90);
      setBackgroundNoise(agent.ambient_sound || null);
      setBackgroundVolume(agent.ambient_sound_volume || 1);
      setVoicemailDetection(agent.voicemail_option !== null && agent.voicemail_option !== undefined);
      if (agent.voicemail_option && typeof agent.voicemail_option === 'object' && 'action' in agent.voicemail_option) {
        const action = (agent.voicemail_option as any).action;
        if (action && typeof action === 'object') {
          if (action.type === 'static_text' && 'text' in action) {
            setVoicemailAction('static_text');
            setVoicemailMessage(action.text || '');
          } else if (action.type === 'prompt' && 'text' in action) {
            setVoicemailAction('prompt');
            setVoicemailMessage(action.text || '');
          } else {
            setVoicemailAction('hangup');
          }
        } else {
          setVoicemailAction('hangup');
        }
      } else {
        setVoicemailAction('hangup');
      }
      setIncomingWebhook(agent.webhook_url || '');
      setWebhookTimeout(agent.webhook_timeout_ms || 10000);
      setResponsiveness(agent.responsiveness || 1);
      setInterruptionSensitivity(agent.interruption_sensitivity || 1);
      setEnableBackchanneling(agent.enable_backchannel || false);
      setBackchannelFrequency(agent.backchannel_frequency || 0.8);
      setEnableSpeechNormalization(agent.normalize_for_speech || false);
      setReminderTrigger(agent.reminder_trigger_ms ? Math.floor(agent.reminder_trigger_ms / 1000) : 10);
      setReminderMaxCount(agent.reminder_max_count || 1);
      setAllowUserDtmf(agent.allow_user_dtmf !== false);
      if (agent.user_dtmf_options) {
        setDtmfTimeout(agent.user_dtmf_options.timeout_ms ? Math.floor(agent.user_dtmf_options.timeout_ms / 1000) : 4);
        setDtmfTerminationKey(agent.user_dtmf_options.termination_key || '#');
        setDtmfDigitLimit(agent.user_dtmf_options.digit_limit || 25);
      }
      setBoostedKeywords(agent.boosted_keywords?.join(', ') || '');
      setDenoisingMode(agent.denoising_mode || 'noise-cancellation');
    }
  }, [agent]);

  const handleSave = () => {
    const settings = {
      data_storage_setting: dataStorageSetting,
      opt_in_signed_url: optInSignedUrl,
      max_call_duration_ms: maxCallTime * 60000,
      end_call_after_silence_ms: silenceTimeout * 60000,
      ring_duration_ms: ringDuration * 1000,
      ambient_sound: backgroundNoise,
      ambient_sound_volume: backgroundVolume,
      begin_message: rulesOfEngagement === 'ai-starts-determined' ? beginMessage : rulesOfEngagement === 'contact-starts' ? '' : null,
      begin_message_delay_ms: beginMessageDelay * 1000,
      webhook_url: incomingWebhook || null,
      webhook_timeout_ms: webhookTimeout,
              voicemail_option: voicemailDetection ? {
                action: voicemailAction === 'static_text' ? {
                  type: 'static_text',
                  text: voicemailMessage || 'Please give us a callback at your convenience.'
                } : voicemailAction === 'prompt' ? {
                  type: 'prompt',
                  text: voicemailMessage || 'Summarize the call in 2 sentences.'
                } : { type: 'hangup' }
              } : null,
              boosted_keywords: boostedKeywords ? boostedKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : null,
              denoising_mode: denoisingMode,
      responsiveness,
      interruption_sensitivity: interruptionSensitivity,
      enable_backchannel: enableBackchanneling,
      backchannel_frequency: backchannelFrequency,
      normalize_for_speech: enableSpeechNormalization,
      reminder_trigger_ms: reminderTrigger * 1000,
      reminder_max_count: reminderMaxCount,
      allow_user_dtmf: allowUserDtmf,
      user_dtmf_options: allowUserDtmf ? {
        timeout_ms: dtmfTimeout * 1000,
        termination_key: dtmfTerminationKey,
        digit_limit: dtmfDigitLimit
      } : null
    };
    if (onSave) onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/20 transition-opacity" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[600px] bg-card shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Call Settings</h2>
              <p className="text-xs text-gray-500">Configure your assistant's call behavior and preferences</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Data Storage */}
          <CollapsibleSection
            title="Data Storage"
            icon={<Info className="w-4 h-4 text-muted-foreground" />}
            isExpanded={expandedSections.dataStorage}
            onToggle={() => toggleSection('dataStorage')}
          >
          <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Recording & Transcript Storage</label>
              <p className="text-xs text-yellow-700 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                Use 'Basic Attributes Only' if you require HIPAA compliance or conversation regulation
              </p>
              <select
                value={dataStorageSetting}
                onChange={(e) => setDataStorageSetting(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="everything">Store Everything</option>
                <option value="everything_except_pii">Store Except PII</option>
                <option value="basic_attributes_only">Basic Attributes Only (HIPAA)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Signed URLs</label>
              <p className="text-xs text-muted-foreground">Generate signed URLs that expire after 24 hours</p>
            <button
                onClick={() => setOptInSignedUrl(!optInSignedUrl)}
                className={`w-full py-2 rounded-lg font-semibold transition-colors text-sm ${
                  optInSignedUrl ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {optInSignedUrl ? 'OPT-IN ENABLED' : 'OPT-IN DISABLED'}
            </button>
            </div>
          </CollapsibleSection>

          {/* Call Duration */}
          <CollapsibleSection
            title="Call Duration"
            icon={<Info className="w-4 h-4 text-muted-foreground" />}
            isExpanded={expandedSections.callDuration}
            onToggle={() => toggleSection('callDuration')}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Max Call Duration (minutes)</label>
            <input
                  type="number" min="1" max="120" value={maxCallTime}
              onChange={(e) => setMaxCallTime(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
                <p className="text-xs text-gray-500">Force end call if reached (1-120 min)</p>
          </div>
          <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">End Call on Silence (minutes)</label>
                <input
                  type="number" min="0.17" step="0.01" value={silenceTimeout}
                  onChange={(e) => setSilenceTimeout(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">End the call if user stays silent for extended period (min: 10 seconds)</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Ring Duration (seconds)</label>
              <p className="text-xs text-muted-foreground">The max ringing duration before the outbound call / transfer call is deemed no answer</p>
            <input
                type="number" min="5" max="90" value={ringDuration}
                onChange={(e) => setRingDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">Range: 5-90 seconds (default: 90s / 1.5m)</p>
            </div>
          </CollapsibleSection>

          {/* Background */}
          <CollapsibleSection
            title="Background Sound"
            icon={<Info className="w-4 h-4 text-muted-foreground" />}
            isExpanded={expandedSections.background}
            onToggle={() => toggleSection('background')}
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-900">Ambient Sound</label>
                <p className="text-xs text-muted-foreground">Add background environment sound to make the call experience more realistic</p>
            <select
                  value={backgroundNoise || 'none'}
                  onChange={(e) => setBackgroundNoise(e.target.value === 'none' ? null : e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="none">None</option>
              <option value="coffee-shop">Coffee Shop</option>
              <option value="convention-hall">Convention Hall</option>
              <option value="summer-outdoor">Summer Outdoor</option>
              <option value="mountain-outdoor">Mountain Outdoor</option>
              <option value="static-noise">Static Noise</option>
              <option value="call-center">Call Center</option>
            </select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-900">Volume</label>
                  <span className="text-sm font-medium text-gray-900">{backgroundVolume}</span>
                </div>
                <p className="text-xs text-muted-foreground">Control the volume of the ambient sound (0-2)</p>
              <input
                  type="range" min="0" max="2" step="0.05" value={backgroundVolume}
                onChange={(e) => setBackgroundVolume(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
          </CollapsibleSection>

          {/* Speech Settings */}
          <CollapsibleSection
            title="Speech Settings"
            icon={<Info className="w-4 h-4 text-muted-foreground" />}
            isExpanded={expandedSections.speech}
            onToggle={() => toggleSection('speech')}
          >
            <div className="space-y-4">
              {/* Responsiveness & Interruption */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-900">Responsiveness</label>
                    <span className="text-sm font-medium text-gray-900">{responsiveness}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Control how fast the agent responds after users finish speaking</p>
                  <input type="range" min="0" max="1" step="0.1" value={responsiveness} onChange={(e) => setResponsiveness(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
            </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-900">Interruption Sensitivity</label>
                    <span className="text-sm font-medium text-gray-900">{interruptionSensitivity}</span>
                    </div>
                  <p className="text-xs text-muted-foreground">Control how sensitively AI can be interrupted by human speech</p>
                  <input type="range" min="0" max="1" step="0.1" value={interruptionSensitivity} onChange={(e) => setInterruptionSensitivity(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              {/* Backchanneling */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-900">Enable Backchanneling</label>
                </div>
                <p className="text-xs text-muted-foreground">Enables the agent to use affirmations like 'yeah' or 'uh-huh' during conversations, indicating active listening and engagement</p>
                <button
                  onClick={() => setEnableBackchanneling(!enableBackchanneling)}
                  className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                    enableBackchanneling ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {enableBackchanneling ? 'ENABLED' : 'DISABLED'}
                </button>
                {enableBackchanneling && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-900">Backchannel Frequency</label>
                      <span className="text-sm font-medium text-gray-900">{backchannelFrequency}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={backchannelFrequency} onChange={(e) => setBackchannelFrequency(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                    <p className="text-xs text-gray-500">Control how often the agent uses backchannel affirmations</p>
                  </div>
                )}
              </div>

              {/* Speech Normalization & Reminders */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Speech Normalization</label>
                <p className="text-xs text-muted-foreground">Converts text elements like numbers, currency, and dates into human-like spoken forms</p>
                <button
                  onClick={() => setEnableSpeechNormalization(!enableSpeechNormalization)}
                  className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                    enableSpeechNormalization ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {enableSpeechNormalization ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Reminder Message Frequency</label>
                <p className="text-xs text-muted-foreground">Control how often AI will send a reminder message</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Trigger (seconds)</label>
                    <input type="number" min="0" max="60" value={reminderTrigger} onChange={(e) => setReminderTrigger(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-500">The AI will respond if no keypad input is detected</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Max Count</label>
                    <input type="number" min="0" max="10" value={reminderMaxCount} onChange={(e) => setReminderMaxCount(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-500">Maximum number of times</p>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* DTMF */}
          <CollapsibleSection
            title="Keypad Input (DTMF)"
            icon={<Info className="w-4 h-4 text-muted-foreground" />}
            isExpanded={expandedSections.dtmf}
            onToggle={() => toggleSection('dtmf')}
          >
            <div className="space-y-3">
            <button
                onClick={() => setAllowUserDtmf(!allowUserDtmf)}
                className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                  allowUserDtmf ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {allowUserDtmf ? 'ENABLED' : 'DISABLED'}
              </button>
              {allowUserDtmf && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">Timeout (sec)</label>
                    <input type="number" min="1" max="60" value={dtmfTimeout} onChange={(e) => setDtmfTimeout(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">Termination Key</label>
                    <select value={dtmfTerminationKey} onChange={(e) => setDtmfTerminationKey(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                      {['#', '*', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
          </div>
          <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-gray-900">Digit Limit</label>
                      <span className="text-sm font-medium text-gray-900">{dtmfDigitLimit}</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={dtmfDigitLimit}
                      onChange={(e) => setDtmfDigitLimit(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-xs text-gray-500">Maximum digits to collect (1-50, default: 25)</p>
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Webhook & Voicemail */}
          <CollapsibleSection
            title="Webhooks & Voicemail"
            icon={<Info className="w-4 h-4 text-muted-foreground" />}
            isExpanded={expandedSections.webhook}
            onToggle={() => toggleSection('webhook')}
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Webhook URL</label>
                <input
                  type="text" value={incomingWebhook} onChange={(e) => setIncomingWebhook(e.target.value)}
                  placeholder="https://your-webhook-url.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Webhook Timeout (ms)</label>
                <input type="number" value={webhookTimeout} onChange={(e) => setWebhookTimeout(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Voicemail Detection</label>
                <p className="text-xs text-muted-foreground">Hang up or leave a voicemail if a voicemail is detected</p>
            <button
              onClick={() => setVoicemailDetection(!voicemailDetection)}
                  className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                    voicemailDetection ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {voicemailDetection ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

              {voicemailDetection && (
                <div className="space-y-3 pt-2 border-t border-border">
          <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-900">Action</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setVoicemailAction('hangup')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          voicemailAction === 'hangup'
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Hang Up
                      </button>
                      <button
                        onClick={() => setVoicemailAction('static_text')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          voicemailAction === 'static_text'
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Static Text
                      </button>
                      <button
                        onClick={() => setVoicemailAction('prompt')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          voicemailAction === 'prompt'
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        Prompt
              </button>
            </div>
          </div>

                  {(voicemailAction === 'static_text' || voicemailAction === 'prompt') && (
          <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900">
                        {voicemailAction === 'static_text' ? 'Message' : 'Prompt'}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {voicemailAction === 'static_text' 
                          ? 'Static sentence that will be left as a voicemail' 
                          : 'Prompt to generate the voicemail message dynamically'}
                      </p>
                      <textarea
                        value={voicemailMessage}
                        onChange={(e) => setVoicemailMessage(e.target.value)}
                        placeholder={voicemailAction === 'static_text' 
                          ? "Hey {{user_name}}, sorry we could not reach you directly. Please give us a callback if you can."
                          : "Summarize the call in 2 sentences."}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-card text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  )}
            </div>
              )}
            </div>
              </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex justify-end space-x-3 bg-card sticky bottom-0">
          <button onClick={handleSave} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
