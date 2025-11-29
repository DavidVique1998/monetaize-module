'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAgents, RetellAgent } from '@/hooks/useAgents';
import { useVoices } from '@/hooks/useVoices';
import { VoiceSelector } from '@/components/assistants/VoiceSelector';
import { ModelConfigDrawer } from '@/components/assistants/ModelConfigDrawer';
import { AgentConfigSidebar } from '@/components/assistants/AgentConfigSidebar';
import { WebCallInterface } from '@/components/assistants/WebCallInterface';
import { ChatLabInterface } from '@/components/assistants/ChatLabInterface';
import { 
  ArrowLeft, 
  Pencil, 
  Copy, 
  Save, 
  Settings as SettingsIcon,
  Sparkles,
  Info,
  Rocket,
  AlertTriangle,
  Cloud,
  CheckCircle2,
  X,
  Tag
} from 'lucide-react';

// Idiomas disponibles según Retell AI
const LANGUAGES = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
];

export default function EditAssistantPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;
  
  const { getAgent, updateAgent, updateAgentStatus } = useAgents();
  const { voices } = useVoices();
  
  const [agent, setAgent] = useState<(RetellAgent & { prompt?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [agentName, setAgentName] = useState('');
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [voiceId, setVoiceId] = useState('');
  const [voiceModel, setVoiceModel] = useState<string | null>(null);
  const [language, setLanguage] = useState('en-US');
  const [llmId, setLlmId] = useState('gpt-4o');
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [ownershipError, setOwnershipError] = useState<{ message: string; agentId: string } | null>(null);
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const [additionalSettings, setAdditionalSettings] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'create' | 'simulation'>('create');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [agentStats, setAgentStats] = useState<{
    costPerMinute: string | null;
    latency: string | null;
    tokens: string | null;
    totalCalls: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (publishError) {
      const timer = setTimeout(() => {
        setPublishError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [publishError]);

  useEffect(() => {
    loadAgent();
    loadAgentStats();
  }, [agentId]);

  const loadAgentStats = async () => {
    if (!agentId) return;
    
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/agents/${agentId}/stats`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAgentStats(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading agent stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (agent) {
      setPrompt(agent.prompt || '');
      setAgentName(agent.agent_name || '');
      setVoiceId(agent.voice_id || '');
      setVoiceModel(agent.voice_model || null);
      setLanguage(agent.language || 'en-US');
      
      // Acceder a llm_id de forma segura
      const responseEngine = agent.response_engine;
      if (responseEngine && typeof responseEngine === 'object' && 'llm_id' in responseEngine) {
        setLlmId(responseEngine.llm_id || 'gpt-4o');
      }

      // Cargar configuraciones adicionales del agente
      setAdditionalSettings({
        responsiveness: agent.responsiveness,
        interruption_sensitivity: agent.interruption_sensitivity,
        enable_backchannel: agent.enable_backchannel,
        voice_temperature: agent.voice_temperature,
        voice_speed: agent.voice_speed,
        volume: agent.volume,
        stt_mode: agent.stt_mode,
        vocab_specialization: agent.vocab_specialization,
        denoising_mode: agent.denoising_mode,
        max_call_duration_ms: agent.max_call_duration_ms,
        end_call_after_silence_ms: agent.end_call_after_silence_ms,
        ring_duration_ms: agent.ring_duration_ms,
        begin_message_delay_ms: agent.begin_message_delay_ms,
        allow_user_dtmf: agent.allow_user_dtmf,
        ambient_sound: agent.ambient_sound,
        post_call_analysis_model: agent.post_call_analysis_model,
        data_storage_setting: agent.data_storage_setting,
        opt_in_signed_url: agent.opt_in_signed_url,
        normalize_for_speech: agent.normalize_for_speech,
        webhook_url: agent.webhook_url,
        webhook_timeout_ms: agent.webhook_timeout_ms,
      });
    }
  }, [agent]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      // El endpoint GET ya devuelve el prompt usando getAgentWithPrompt
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) {
        throw new Error('Failed to load agent');
      }
      const result = await response.json();
      const agentData = result.data;
      setAgent(agentData);
      
      // El prompt ya viene en agentData.prompt si existe
      if (agentData.prompt) {
        setPrompt(agentData.prompt);
      }
      
      // Also update the agent in the main agents list to keep it in sync
      updateAgentStatus(agentId, {
        version: agentData.version,
        is_published: (agentData as any).is_published,
        last_modification_timestamp: agentData.last_modification_timestamp
      });
    } catch (error) {
      console.error('Error loading agent:', error);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agent) return;
    
    setIsSaving(true);
    try {
      // Preparar datos según la documentación de Retell AI
      const allSettings: any = {
        agent_name: agentName,
        voice_id: voiceId,
        language: language,
        prompt: prompt, // El endpoint de agentes maneja el prompt
        ...(voiceModel && { voice_model: voiceModel }),
        response_engine: {
          ...agent.response_engine,
          llm_id: llmId,
        },
        ...additionalSettings, // Incluir configuraciones adicionales del sidebar
      };

      // Actualizar el agente (el endpoint maneja el prompt automáticamente)
      await updateAgent(agentId, allSettings);

      setIsSaved(true);
      setOwnershipError(null);
    } catch (error: any) {
      console.error('Error saving agent:', error);
      
      if (error.isOwnershipError) {
        setOwnershipError({
          message: error.message,
          agentId: error.agentId
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!agent) return;
    
    setIsPublishing(true);
    setPublishError(null);
    try {
      const response = await fetch(`/api/agents/${agentId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to publish agent`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.data) {
          setAgent(result.data);
          updateAgentStatus(agentId, {
            version: result.data.version,
            is_published: result.data.is_published,
            last_modification_timestamp: result.data.last_modification_timestamp
          });
        }
      } else {
        throw new Error(result.error || 'Failed to publish agent');
      }
    } catch (error: any) {
      console.error('Error publishing agent:', error);
      setPublishError(error.message || 'Failed to publish agent');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setIsSaved(false);
    // Auto-guardar después de 2 segundos de inactividad
    scheduleAutoSave();
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    // Solo auto-guardar si hay cambios sin guardar
    if (!isSaved) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // 2 segundos de debounce
      setAutoSaveTimer(timer);
    }
  };

  const handleAutoSave = async () => {
    if (!agent || isSaving) return;
    
    try {
      setIsAutoSaving(true);
      const allSettings: any = {
        agent_name: agentName,
        voice_id: voiceId,
        language: language,
        prompt: prompt,
        ...(voiceModel && { voice_model: voiceModel }),
        response_engine: {
          ...agent.response_engine,
          llm_id: llmId,
        },
        ...additionalSettings,
      };

      await updateAgent(agentId, allSettings);
      setIsSaved(true);
    } catch (error: any) {
      console.error('Error auto-saving:', error);
      // No mostrar error al usuario en auto-save, solo log
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const handleCopyId = () => {
    if (agent) {
      navigator.clipboard.writeText(agent.agent_id);
    }
  };

  const handleModelSave = (newLlmId: string) => {
    setLlmId(newLlmId);
    setIsSaved(false);
  };

  const selectedLanguage = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
  const selectedVoice = voices.find(v => v.voice_id === voiceId);
  const characterCount = prompt.length;
  const characterLimit = 8024;

  // Obtener LLM ID para mostrar
  const displayLlmId = agent?.response_engine && 'llm_id' in agent.response_engine 
    ? agent.response_engine.llm_id 
    : llmId;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assistant...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Assistant not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-white">
        {/* Top Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and Title */}
            <div className="flex items-center space-x-4 flex-1">
              <button
                onClick={() => router.push('/assistants')}
                className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div>
                {isNameEditing ? (
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => {
                      setAgentName(e.target.value);
                      setIsSaved(false);
                    }}
                    onBlur={() => setIsNameEditing(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsNameEditing(false);
                    }}
                    className="text-xl font-semibold text-gray-900 border border-purple-500 rounded px-3 py-1.5 bg-white"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {agentName || 'Unnamed Assistant'}
                    </h1>
                    <button
                      onClick={() => setIsNameEditing(true)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
                
                {/* Agent Info */}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Agent ID:</span>
                    <span className="font-mono">{agent.agent_id.substring(0, 6)}...{agent.agent_id.substring(agent.agent_id.length - 4)}</span>
                    <button
                      onClick={handleCopyId}
                      className="p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer ml-1"
                    >
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Retell LLM ID:</span>
                    <span className="font-mono">{displayLlmId?.substring(0, 6)}...{displayLlmId?.substring(displayLlmId.length - 4)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {loadingStats ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : agentStats?.costPerMinute ? (
                      <span>{agentStats.costPerMinute}</span>
                    ) : (
                      <span className="text-gray-400">No data</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {loadingStats ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : agentStats?.latency ? (
                      <span>{agentStats.latency}</span>
                    ) : (
                      <span className="text-gray-400">No data</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {loadingStats ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : agentStats?.tokens ? (
                      <span>{agentStats.tokens}</span>
                    ) : (
                      <span className="text-gray-400">No data</span>
                    )}
                  </div>
                  {agentStats && agentStats.totalCalls > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <span>({agentStats.totalCalls} calls)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={isSaved || isSaving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center cursor-pointer disabled:cursor-not-allowed"
              >
                <Cloud className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                onClick={handlePublish}
                disabled={isPublishing || !isSaved || !agent || (agent as any).is_published}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center cursor-pointer disabled:cursor-not-allowed"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {isPublishing ? 'Publishing...' : 'Publish Agent'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Main Editor or Test Interface */}
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {activeTab === 'create' ? (
              <>
            {/* Controls Bar */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {/* Model Selector */}
                <div className="relative">
                  <select
                    value={llmId}
                    onChange={(e) => {
                      setLlmId(e.target.value);
                      setIsSaved(false);
                    }}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer pr-8"
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  </select>
                  <button
                    onClick={() => setShowModelDrawer(true)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <SettingsIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Voice Selector */}
                <VoiceSelector
                  voices={voices}
                  value={voiceId}
                  onChange={(voiceId) => {
                    setVoiceId(voiceId);
                    setIsSaved(false);
                    scheduleAutoSave();
                  }}
                />

                {/* Language Selector */}
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      setIsSaved(false);
                      scheduleAutoSave();
                    }}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer flex items-center"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2 text-sm">
                {isAutoSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-purple-600 font-medium">Auto-saving...</span>
                  </>
                ) : agent && (agent as any).is_published ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Published</span>
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Saved</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-yellow-600 font-medium">Unsaved changes</span>
                  </>
                )}
              </div>
            </div>

            {/* Prompt Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Global Prompt</h2>
                <span className="text-sm text-gray-500">
                  {characterCount} / {characterLimit} characters
                </span>
                <button className="p-1">
                  <Info className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                  <Tag className="w-3 h-3" />
                  <span>Dynamic Greeting</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                  <Tag className="w-3 h-3" />
                  <span>Fields & Values</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                  <Pencil className="w-3 h-3" />
                  <span>Add Snippet</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Prompt</span>
                </button>
              </div>
            </div>

            {/* Prompt Textarea */}
            <textarea
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Type in a universal prompt for your agent, such as its role, conversational style, objective, etc."
              className="flex-1 w-full min-h-[500px] p-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none bg-white border border-gray-200 rounded-lg"
            />
              </>
            ) : (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Warning if unsaved changes */}
                {!isSaved && (
                  <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 font-medium">Unsaved Changes</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        You have unsaved changes. Please save your agent before testing to ensure you're testing with the latest configuration.
                      </p>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Now'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Voice Lab - Web Call Interface */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Lab</h3>
                  <WebCallInterface 
                    agentId={agentId}
                    agentName={agentName}
                    onCallStart={() => console.log('Call started')}
                    onCallEnd={() => console.log('Call ended')}
                  />
                </div>

                {/* Chat Lab */}
                <div className="flex-1 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Lab</h3>
                  <ChatLabInterface 
                    agentId={agentId} 
                    agentName={agentName} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Configuration Options */}
          <AgentConfigSidebar
            agent={agent}
            settings={additionalSettings}
            onSettingsChange={(settings) => {
              setAdditionalSettings((prev: any) => ({ ...prev, ...settings }));
              setIsSaved(false);
            }}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Error Messages */}
        {publishError && (
          <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-right duration-300">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Failed to publish agent</p>
                <p className="text-xs text-red-700 mt-1 break-words">{publishError}</p>
              </div>
              <button
                onClick={() => setPublishError(null)}
                className="text-red-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {ownershipError && (
          <div className="fixed top-4 right-4 z-50 bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-right duration-300">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-orange-800 font-medium">Agent Ownership Issue</p>
                <p className="text-xs text-orange-700 mt-1 break-words">
                  Este agente no está vinculado correctamente con tu cuenta.
                </p>
                <button
                  onClick={() => router.push('/debug/agents')}
                  className="mt-2 text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Ir a Debug Tools
                </button>
              </div>
              <button
                onClick={() => setOwnershipError(null)}
                className="text-orange-400 hover:text-orange-600 transition-colors ml-2 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Model Config Drawer */}
        <ModelConfigDrawer
          isOpen={showModelDrawer}
          onClose={() => setShowModelDrawer(false)}
          llmId={llmId}
          onSave={handleModelSave}
        />
      </div>
    </DashboardLayout>
  );
}
