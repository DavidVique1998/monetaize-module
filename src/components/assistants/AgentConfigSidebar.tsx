'use client';

import { useState } from 'react';
import { 
  Grid3x3, 
  BookOpen, 
  Volume2, 
  Mic, 
  Phone, 
  BarChart3, 
  Shield, 
  Globe, 
  Link2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RetellAgent } from '@/lib/retell';

interface AgentConfigSidebarProps {
  agent: RetellAgent | null;
  onSettingsChange: (settings: any) => void;
  settings?: any;
  activeTab?: 'create' | 'simulation';
  onTabChange?: (tab: 'create' | 'simulation') => void;
}

interface ConfigSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ConfigSection({ title, icon, isExpanded, onToggle, children }: ConfigSectionProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function AgentConfigSidebar({ 
  agent, 
  onSettingsChange, 
  settings = {},
  activeTab = 'create',
  onTabChange
}: AgentConfigSidebarProps) {
  // Usar settings si están disponibles, sino usar valores del agente
  const getValue = (key: string, defaultValue: any) => {
    return settings[key] !== undefined ? settings[key] : (agent?.[key as keyof RetellAgent] ?? defaultValue);
  };
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    functions: false,
    knowledgeBase: false,
    speechSettings: false,
    transcriptionSettings: false,
    callSettings: false,
    postCallExtraction: false,
    securitySettings: false,
    webhookSettings: false,
    mcps: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => onTabChange?.('create')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'text-gray-900 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Create
        </button>
        <button 
          onClick={() => onTabChange?.('simulation')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'simulation'
              ? 'text-gray-900 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Simulation
        </button>
      </div>

      {/* Configuration Sections */}
      <div className="divide-y divide-gray-200">
        {/* Functions */}
        <ConfigSection
          title="Functions"
          icon={<Grid3x3 className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.functions}
          onToggle={() => toggleSection('functions')}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Configure function calling capabilities for your agent.
            </p>
            <button className="w-full px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              Add Function
            </button>
          </div>
        </ConfigSection>

        {/* Knowledge Base */}
        <ConfigSection
          title="Knowledge Base"
          icon={<BookOpen className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.knowledgeBase}
          onToggle={() => toggleSection('knowledgeBase')}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Connect your knowledge base to provide context to your agent.
            </p>
            <button className="w-full px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              Connect Knowledge Base
            </button>
          </div>
        </ConfigSection>

        {/* Speech Settings */}
        <ConfigSection
          title="Speech Settings"
          icon={<Volume2 className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.speechSettings}
          onToggle={() => toggleSection('speechSettings')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Responsiveness
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={getValue('responsiveness', 1)}
                onChange={(e) => onSettingsChange({ responsiveness: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Less responsive</span>
                <span>More responsive</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Interruption Sensitivity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={getValue('interruption_sensitivity', 1)}
                onChange={(e) => onSettingsChange({ interruption_sensitivity: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Less sensitive</span>
                <span>More sensitive</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Enable Backchannel
              </label>
              <input
                type="checkbox"
                checked={getValue('enable_backchannel', false)}
                onChange={(e) => onSettingsChange({ enable_backchannel: e.target.checked })}
                className="w-4 h-4 text-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Voice Temperature
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={getValue('voice_temperature', 1)}
                onChange={(e) => onSettingsChange({ voice_temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Voice Speed
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={getValue('voice_speed', 1)}
                onChange={(e) => onSettingsChange({ voice_speed: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Volume
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={getValue('volume', 1)}
                onChange={(e) => onSettingsChange({ volume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </ConfigSection>

        {/* Realtime Transcription Settings */}
        <ConfigSection
          title="Realtime Transcription Settings"
          icon={<Mic className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.transcriptionSettings}
          onToggle={() => toggleSection('transcriptionSettings')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                STT Mode
              </label>
              <select
                value={getValue('stt_mode', 'fast')}
                onChange={(e) => onSettingsChange({ stt_mode: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="fast">Fast</option>
                <option value="accurate">Accurate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Vocab Specialization
              </label>
              <select
                value={getValue('vocab_specialization', 'general')}
                onChange={(e) => onSettingsChange({ vocab_specialization: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="general">General</option>
                <option value="medical">Medical</option>
                <option value="legal">Legal</option>
                <option value="finance">Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Denoising Mode
              </label>
              <select
                value={getValue('denoising_mode', 'noise-cancellation')}
                onChange={(e) => onSettingsChange({ denoising_mode: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="noise-cancellation">Noise Cancellation</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </ConfigSection>

        {/* Call Settings */}
        <ConfigSection
          title="Call Settings"
          icon={<Phone className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.callSettings}
          onToggle={() => toggleSection('callSettings')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Call Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={getValue('max_call_duration_ms', 3600000) / 60000}
                onChange={(e) => onSettingsChange({ max_call_duration_ms: parseInt(e.target.value) * 60000 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Call After Silence (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="600"
                value={getValue('end_call_after_silence_ms', 600000) / 1000}
                onChange={(e) => onSettingsChange({ end_call_after_silence_ms: parseInt(e.target.value) * 1000 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ring Duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={getValue('ring_duration_ms', 30000) / 1000}
                onChange={(e) => onSettingsChange({ ring_duration_ms: parseInt(e.target.value) * 1000 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Begin Message Delay (ms)
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                value={getValue('begin_message_delay_ms', 1000)}
                onChange={(e) => onSettingsChange({ begin_message_delay_ms: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Allow User DTMF
              </label>
              <input
                type="checkbox"
                checked={getValue('allow_user_dtmf', false)}
                onChange={(e) => onSettingsChange({ allow_user_dtmf: e.target.checked })}
                className="w-4 h-4 text-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Ambient Sound
              </label>
              <select
                value={getValue('ambient_sound', null) || 'null'}
                onChange={(e) => onSettingsChange({ ambient_sound: e.target.value === 'null' ? null : e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="null">None</option>
                <option value="coffee-shop">Coffee Shop</option>
                <option value="convention-hall">Convention Hall</option>
                <option value="summer-outdoor">Summer Outdoor</option>
                <option value="mountain-outdoor">Mountain Outdoor</option>
                <option value="static-noise">Static Noise</option>
                <option value="call-center">Call Center</option>
              </select>
            </div>
          </div>
        </ConfigSection>

        {/* Post-Call Data Extraction */}
        <ConfigSection
          title="Post-Call Data Extraction"
          icon={<BarChart3 className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.postCallExtraction}
          onToggle={() => toggleSection('postCallExtraction')}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Configure data extraction after calls complete.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Analysis Model
              </label>
              <select
                value={getValue('post_call_analysis_model', 'gpt-4o-mini')}
                onChange={(e) => onSettingsChange({ post_call_analysis_model: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
              </select>
            </div>
            <button className="w-full px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              Configure Extraction Fields
            </button>
          </div>
        </ConfigSection>

        {/* Security & Fallback Settings */}
        <ConfigSection
          title="Security & Fallback Settings"
          icon={<Shield className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.securitySettings}
          onToggle={() => toggleSection('securitySettings')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Data Storage Setting
              </label>
              <select
                value={getValue('data_storage_setting', 'everything')}
                onChange={(e) => onSettingsChange({ data_storage_setting: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="everything">Everything</option>
                <option value="transcript-only">Transcript Only</option>
                <option value="metadata-only">Metadata Only</option>
                <option value="nothing">Nothing</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Opt-in Signed URL
              </label>
              <input
                type="checkbox"
                checked={getValue('opt_in_signed_url', false)}
                onChange={(e) => onSettingsChange({ opt_in_signed_url: e.target.checked })}
                className="w-4 h-4 text-purple-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Normalize for Speech
              </label>
              <input
                type="checkbox"
                checked={getValue('normalize_for_speech', false)}
                onChange={(e) => onSettingsChange({ normalize_for_speech: e.target.checked })}
                className="w-4 h-4 text-purple-600"
              />
            </div>
          </div>
        </ConfigSection>

        {/* Webhook Settings */}
        <ConfigSection
          title="Webhook Settings"
          icon={<Globe className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.webhookSettings}
          onToggle={() => toggleSection('webhookSettings')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={getValue('webhook_url', '')}
                onChange={(e) => onSettingsChange({ webhook_url: e.target.value })}
                placeholder="https://example.com/webhook"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Webhook Timeout (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="30000"
                value={getValue('webhook_timeout_ms', 10000)}
                onChange={(e) => onSettingsChange({ webhook_timeout_ms: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </ConfigSection>

        {/* MCPs */}
        <ConfigSection
          title="MCPs"
          icon={<Link2 className="w-4 h-4 text-gray-600" />}
          isExpanded={expandedSections.mcps}
          onToggle={() => toggleSection('mcps')}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Configure Model Context Protocol connections.
            </p>
            <button className="w-full px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              Add MCP Connection
            </button>
          </div>
        </ConfigSection>
      </div>
    </div>
  );
}

