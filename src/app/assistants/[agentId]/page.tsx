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
  Tag,
  Play,
  Edit3,
  Globe,
  Mic,
  Cpu,
  LayoutTemplate,
  MessageSquare
} from 'lucide-react';

// Idiomas disponibles según Retell AI
const LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
];

// Modelos LLM disponibles en Retell AI
const LLM_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Preview)', provider: 'Google' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
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
  const [llmModel, setLlmModel] = useState('gpt-4o');
  const [currentLlmId, setCurrentLlmId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [ownershipError, setOwnershipError] = useState<{ message: string; agentId: string } | null>(null);
  const [additionalSettings, setAdditionalSettings] = useState<any>({});
  
  // Versiones del agente/LLM
  const [versions, setVersions] = useState<Array<{ version: number; is_published?: boolean }>>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  
  // Reemplazo de activeTab por viewMode para mayor claridad
  const [viewMode, setViewMode] = useState<'edit' | 'test'>('edit');
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  
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
    loadAgentVersions();
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

  const loadAgentVersions = async () => {
    if (!agentId) return;
    try {
      const response = await fetch(`/api/agents/${agentId}/versions`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setVersions(result.data);
          // Seleccionar la versión más reciente por defecto
          const latest = result.data[0]?.version ?? null;
          if (latest !== null) {
            setSelectedVersion(latest);
          }
        }
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  useEffect(() => {
    if (agent) {
      setPrompt(agent.prompt || '');
      setAgentName(agent.agent_name || '');
      setVoiceId(agent.voice_id || '');
      setVoiceModel(agent.voice_model || null);
      setLanguage(agent.language || 'en-US');
      
      const responseEngine = agent.response_engine;
      if (responseEngine && typeof responseEngine === 'object' && 'llm_id' in responseEngine) {
        setCurrentLlmId(responseEngine.llm_id || null);
      }

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

  const loadAgent = async (version?: number) => {
    try {
      setLoading(true);
      const versionQuery = version !== undefined ? `?version=${version}` : '';
      const response = await fetch(`/api/agents/${agentId}${versionQuery}`);
      if (!response.ok) {
        throw new Error('Failed to load agent');
      }
      const result = await response.json();
      const agentData = result.data;
      setAgent(agentData);
      if (version !== undefined) {
        setSelectedVersion(version);
      } else if (agentData.version !== undefined) {
        setSelectedVersion(agentData.version);
      }
      
      if (agentData.prompt) {
        setPrompt(agentData.prompt);
      }

      if (agentData.llm_model) {
        setLlmModel(agentData.llm_model);
      }
      
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
      const allSettings: any = {
        agent_name: agentName,
        voice_id: voiceId,
        language: language,
        prompt: prompt,
        llm_model: llmModel,
        ...(voiceModel && { voice_model: voiceModel }),
        response_engine: {
          ...agent.response_engine,
        },
        ...additionalSettings,
      };

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
          // Refrescar versiones y estado
          loadAgentVersions();
          setSelectedVersion(result.data.version ?? null);
          setIsSaved(true);
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
    scheduleAutoSave();
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    if (!isSaved) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); 
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
        llm_model: llmModel,
        ...(voiceModel && { voice_model: voiceModel }),
        response_engine: {
          ...agent.response_engine,
        },
        ...additionalSettings,
      };

      await updateAgent(agentId, allSettings);
      setIsSaved(true);
    } catch (error: any) {
      console.error('Error auto-saving:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

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

  const handleModelSave = (newLlmModel: string) => {
    setLlmModel(newLlmModel);
    setIsSaved(false);
  };

  const handleVersionChange = async (value: number) => {
    await loadAgent(value);
  };

  const selectedLanguage = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];
  const selectedVoice = voices.find(v => v.voice_id === voiceId);
  const characterCount = prompt.length;
  const characterLimit = 8024;
  const displayLlmId = currentLlmId;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading assistant...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center p-8 bg-card rounded-xl shadow-sm border border-gray-200">
            <AlertTriangle className="w-12 h-12 text-yellowbg-background0 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Assistant Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find the assistant you're looking for.</p>
            <button 
              onClick={() => router.push('/assistants')}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Assistants
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Modern Header */}
        <header className="bg-card border-b border-gray-200 shadow-sm z-10 sticky top-0">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Back & Title */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/assistants')}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-graybg-background0 hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3">
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
                        className="text-lg font-bold text-foreground border-b-2 border-primary focus:outline-none bg-transparent px-1 min-w-[200px]"
                        autoFocus
                      />
                    ) : (
                      <h1 
                        className="text-lg font-bold text-foreground cursor-pointer hover:text-purple-600 transition-colors flex items-center group"
                        onClick={() => setIsNameEditing(true)}
                      >
                        {agentName || 'Unnamed Assistant'}
                        <Pencil className="w-3.5 h-3.5 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h1>
                    )}
                    
                    {agent && (agent as any).is_published ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-greenbg-background0/10 text-green-700 border-greenbg-background0/20">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Draft
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-graybg-background0 mt-0.5 space-x-2">
                    <span className="flex items-center cursor-pointer hover:text-purple-600 transition-colors bg-muted border border-border" onClick={handleCopyId} title="Copy Agent ID">
                      ID: {agent.agent_id.substring(0, 8)}...
                      <Copy className="w-2.5 h-2.5 ml-1" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center mr-2 text-xs">
                  {isAutoSaving ? (
                    <span className="text-purple-600 flex items-center bg-purplebg-background px-2 py-1 rounded-full">
                      <div className="w-2.5 h-2.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-1.5" />
                      Saving...
                    </span>
                  ) : !isSaved ? (
                    <span className="text-yellow-700 flex items-center bg-yellowbg-background0/10 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-yellowbg-background0/100 rounded-full mr-1.5" />
                      Unsaved changes
                    </span>
                  ) : (
                    <span className="text-green-700 flex items-center bg-greenbg-background px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                      All saved
                    </span>
                  )}
                </div>

                <div className="h-6 w-px bg-border mx-1"></div>

                <button
                  onClick={handleSave}
                  disabled={isSaved || isSaving}
                  className={`p-2 rounded-lg transition-all border ${
                    isSaved 
                      ? 'bg-graybg-background text-muted-foreground border-gray-200 cursor-not-allowed shadow-none' 
                      : 'bg-card text-gray-700 border-graybg-border hover:bg-graybg-background hover:text-foreground hover:border-gray-400 shadow-sm'
                  }`}
                  title="Save Changes manually"
                >
                  <Save className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !isSaved || !agent || (agent as any).is_published}
                  className="flex items-center bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-muted-foreground text-white text-sm font-medium px-5 py-2 rounded-lg transition-all shadow-sm hover:shadow disabled:shadow-none"
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Publishing
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Navigation Tabs and Quick Settings Combined Row */}
            <div className="mt-6 flex flex-col xl:flex-row items-center justify-between gap-4">
              {/* Tabs (Left side) */}
              <div className="flex bg-muted/10 p-1 rounded-lg border border-gray-200 w-full max-w-md xl:max-w-xs shrink-0">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'edit' 
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                  Editor
                </button>
                <button
                  onClick={() => setViewMode('test')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'test' 
                      ? 'bg-card text-purple-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Simulator
                </button>
              </div>

              {/* Quick Settings Bar + Version Selector (Right side - Only in Edit Mode) */}
              {viewMode === 'edit' && (
                <div className="flex flex-wrap items-center justify-center xl:justify-end gap-3 w-full">
                  {/* Version Selector */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-graybg-background0 uppercase tracking-wider pl-1">Version</label>
                    <div className="relative">
                      <select
                        value={selectedVersion ?? ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isNaN(val)) {
                            handleVersionChange(val);
                          }
                        }}
                        className="pl-3 pr-8 py-2 w-32 bg-card border border-gray-200 text-foreground text-sm rounded-lg focus:ring-purplebg-background0 focus:border-primary block shadow-sm hover:border-graybg-border transition-all cursor-pointer appearance-none"
                      >
                        {versions.map((v) => (
                          <option key={v.version} value={v.version}>
                            v{v.version}{v.is_published ? ' • Published' : ' • Draft'}
                          </option>
                        ))}
                        {versions.length === 0 && <option value="">Current</option>}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Model Selector */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-graybg-background0 uppercase tracking-wider pl-1">AI Model</label>
                    <div className="relative group">
                    
                      <select
                        value={llmModel}
                        onChange={(e) => {
                          setLlmModel(e.target.value);
                          setIsSaved(false);
                          scheduleAutoSave();
                        }}
                        className="pl-12 pr-8 py-2 w-full xl:w-56 bg-card border border-gray-200 text-foreground text-sm rounded-lg focus:ring-purplebg-background0 focus:border-primary block shadow-sm hover:border-graybg-border transition-all cursor-pointer appearance-none relative"
                      >
                        {LLM_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <SettingsIcon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Voice Selector */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-graybg-background0 uppercase tracking-wider pl-1">Voice</label>
                    <div className="relative w-full xl:w-56">
                      <VoiceSelector
                        voices={voices}
                        value={voiceId}
                        onChange={(voiceId) => {
                          setVoiceId(voiceId);
                          setIsSaved(false);
                          scheduleAutoSave();
                        }}
                        minimal={false}
                      />
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-graybg-background0 uppercase tracking-wider pl-1">Language</label>
                    <div className="relative group">
                      <select
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          setIsSaved(false);
                          scheduleAutoSave();
                        }}
                        className="pl-12 pr-8 py-2 w-full xl:w-56 bg-card border border-gray-200 text-foreground text-sm rounded-lg focus:ring-purplebg-background0 focus:border-primary block shadow-sm hover:border-graybg-border transition-all cursor-pointer appearance-none relative"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor/Test View */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {viewMode === 'edit' ? (
              <div className="flex-1 overflow-y-auto p-6 bg-background/50">
                <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col">
                  {/* Prompt Editor */}
                  <div className="bg-card rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-[500px] transition-shadow hover:shadow-md">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-foreground">System Prompt</h2>
                          <p className="text-xs text-graybg-background0">Define the persona and behavior of your agent</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 bg-background px-3 py-1.5 rounded-lg border border-gray-100">
                        <span className={`text-xs font-mono font-medium ${characterCount > characterLimit ? 'text-redbg-background0' : 'text-graybg-background0'}`}>
                          {characterCount} / {characterLimit}
                        </span>
                        <div className="h-3 w-px bg-border"></div>
                        <button className="text-xs text-purple-600 font-medium hover:text-primary flex items-center transition-colors">
                          <Info className="w-3 h-3 mr-1" />
                          Tips
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 relative group">
                      <textarea
                        value={prompt}
                        onChange={(e) => handlePromptChange(e.target.value)}
                        placeholder="You are a helpful AI assistant..."
                        className="absolute inset-0 w-full h-full p-8 bg-background text-foreground placeholder-gray-400 focus:outline-none resize-none font-mono selection:bg-primary/10"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Test Mode View */
              <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Warning Banner */}
                  {!isSaved && (
                    <div className="bg-amberbg-background border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 durationbg-border">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-700 shadow-sm">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-900">Unsaved Changes Detected</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Your recent edits are not active in the simulator yet.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="text-xs font-bold bg-amberbg-background0 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow disabled:opacitybg-background disabled:shadow-none"
                      >
                        {isSaving ? 'Saving...' : 'Save & Reload Simulators'}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
                    {/* Voice Lab Card */}
                    <div className="bg-card rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
                      <div className="px-6 py-5 border-b border-border bg-primary/5 from-primary/10 to-card flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-card border border-gray-100 rounded-lg shadow-sm">
                            <Mic className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">Web Call Simulator</h3>
                            <p className="text-xs text-graybg-background0">Test voice interaction latency and quality</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-greenbg-background0 rounded-full animate-pulse"></span>
                          <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Ready</span>
                        </div>
                      </div>
                      <div className="flex-1 p-8 flex flex-col justify-center bg-card">
                        <WebCallInterface 
                          agentId={agentId}
                          agentName={agentName}
                          onCallStart={() => console.log('Call started')}
                          onCallEnd={() => console.log('Call ended')}
                        />
                      </div>
                    </div>

                    {/* Chat Lab Card */}
                    <div className="bg-card rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md">
                      <div className="px-6 py-5 border-b border-border bg-primary/5 from-primary/10 to-card flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-card border border-gray-100 rounded-lg shadow-sm">
                            <MessageSquare className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">Chat Logic Simulator</h3>
                            <p className="text-xs text-graybg-background0">Debug conversation flow and tools</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background/30">
                        <ChatLabInterface 
                          agentId={agentId} 
                          agentName={agentName} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Always visible in Edit Mode, Hidden in Test Mode */}
          {viewMode === 'edit' && (
            <div className="w-80 border-l border-gray-200 bg-card shadow-xl z-20 overflow-y-auto">
              <AgentConfigSidebar
                agent={agent}
                settings={additionalSettings}
                onSettingsChange={(settings) => {
                  setAdditionalSettings((prev: any) => ({ ...prev, ...settings }));
                  setIsSaved(false);
                }}
                activeTab="create"
                onTabChange={(tab) => setViewMode(tab === 'create' ? 'edit' : 'test')}
              />
            </div>
          )}
        </div>

        {/* Global Error/Notification Toasts */}
        {publishError && (
          <div className="fixed bottom-6 right-6 zbg-background bg-redbg-background border border-red-200 rounded-xl p-4 shadow-xl max-w-sm animate-in slide-in-from-bottom durationbg-border flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Publish Failed</p>
              <p className="text-xs text-destructive mt-1">{publishError}</p>
            </div>
            <button onClick={() => setPublishError(null)} className="text-red-400 hover:text-destructive transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {ownershipError && (
          <div className="fixed bottom-6 right-6 zbg-background bg-orangebg-background border border-orange-200 rounded-xl p-4 shadow-xl max-w-sm animate-in slide-in-from-bottom durationbg-border flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-800">Ownership Error</p>
              <p className="text-xs text-orange-600 mt-1">{ownershipError.message}</p>
              <button
                onClick={() => router.push('/debug/agents')}
                className="mt-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Fix in Debug
              </button>
            </div>
            <button onClick={() => setOwnershipError(null)} className="text-orange-400 hover:text-orange-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Model Config Drawer - Opcional, si queremos mantener ajustes avanzados del LLM */}
        <ModelConfigDrawer
          isOpen={showModelDrawer}
          onClose={() => setShowModelDrawer(false)}
          llmId={llmModel}
          onSave={handleModelSave}
        />
      </div>
    </DashboardLayout>
  );
}
