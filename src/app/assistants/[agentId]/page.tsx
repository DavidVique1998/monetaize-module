'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAgents, RetellAgent } from '@/hooks/useAgents';
import { useVoices } from '@/hooks/useVoices';
import { VoiceSelector } from '@/components/assistants/VoiceSelector';
import { CallSettingsModal } from '@/components/assistants/CallSettingsModal';
import { VoiceSettingsModal } from '@/components/assistants/VoiceSettingsModal';
import { WebCallInterface } from '@/components/assistants/WebCallInterface';
import { ChatLabInterface } from '@/components/assistants/ChatLabInterface';
import { 
  ArrowLeft, 
  Pencil, 
  Copy, 
  Save, 
  Phone, 
  Settings as SettingsIcon,
  Volume2,
  Tag,
  Sparkles,
  Info,
  ChevronRight,
  FlaskConical,
  Users,
  Rocket,
  RotateCw,
  AlertTriangle,
  Cloud,
  Calendar,
  CheckCircle2,
  Paperclip,
  Search,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Trash2,
  Wrench,
  ArrowUp,
  ArrowDown,
  Plus,
  Image
} from 'lucide-react';

type TabType = 'builder' | 'voice' | 'chat' | 'knowledge';

export default function EditAssistantPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.agentId as string;
  
  const { getAgent, updateAgent, updateAgentStatus } = useAgents();
  const { voices } = useVoices();
  
  const [agent, setAgent] = useState<(RetellAgent & { prompt?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('builder');
  const [prompt, setPrompt] = useState('');
  const [agentName, setAgentName] = useState('');
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [voiceId, setVoiceId] = useState('');
  const [voiceModel, setVoiceModel] = useState<string | null>(null);
  const [voiceTemperature, setVoiceTemperature] = useState(1);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [llmId, setLlmId] = useState('gpt-4o');
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showCallSettings, setShowCallSettings] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (publishError) {
      const timer = setTimeout(() => {
        setPublishError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [publishError]);

  const handleCallSettingsSave = (settings: any) => {
    // Store settings without saving yet, just update state
    setCallSettings(settings);
    setIsSaved(false);
  };

  const [callSettings, setCallSettings] = useState<any>(null);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  useEffect(() => {
    if (agent) {
      setPrompt(agent.prompt || '');
      setAgentName(agent.agent_name || '');
      setVoiceId(agent.voice_id || '');
      setVoiceModel(agent.voice_model || null);
      setVoiceTemperature(agent.voice_temperature || 1);
      setVoiceSpeed(agent.voice_speed || 1);
      setVolume(agent.volume || 1);
      
      // Acceder a llm_id de forma segura
      const responseEngine = agent.response_engine;
      if (responseEngine && typeof responseEngine === 'object' && 'llm_id' in responseEngine) {
        setLlmId(responseEngine.llm_id || 'gpt-4o');
      }
    }
  }, [agent]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const agentData = await getAgent(agentId);
      setAgent(agentData);
      
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
      // Combine all settings
      const allSettings: any = {
        agent_name: agentName,
        prompt: prompt,
        voice_id: voiceId,
        voice_model: voiceModel,
        voice_temperature: voiceTemperature,
        voice_speed: voiceSpeed,
        volume: volume,
        response_engine: {
          ...agent.response_engine,
          llm_id: llmId,
        },
      };

      // Include call settings if they were modified
      if (callSettings) {
        Object.assign(allSettings, callSettings);
      }

      await updateAgent(agentId, allSettings);
      setIsSaved(true);
      setCallSettings(null); // Clear call settings after save
      // No need to reload - updateAgent already updates the local state
    } catch (error) {
      console.error('Error saving agent:', error);
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

      console.log('Publish response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Publish API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to publish agent`);
      }

      const result = await response.json();
      console.log('Publish result:', result);
      
      if (result.success) {
        // Use the updated agent data returned from the API
        console.log('Agent published successfully');
        console.log('Updated agent data:', result.data);
        
        // Update the local agent state with the real data from Retell
        if (result.data) {
          setAgent(result.data);
          
          // Also update the agent in the main agents list
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
  };

  const handleCopyId = () => {
    if (agent) {
      navigator.clipboard.writeText(agent.agent_id);
    }
  };

  const selectedVoice = voices.find(v => v.voice_id === voiceId);
  const characterCount = prompt.length;
  const characterLimit = 8024;

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
        {/* Top Navigation with Tabs */}
        <div className="border-b border-gray-200">
          {/* Back button and Title */}
          <div className="px-6 py-3 flex items-center justify-between border-b border-gray-200">
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
                    className="text-base font-semibold text-gray-900 border border-purple-500 rounded px-2 py-1"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 className="text-base font-semibold text-gray-900">
                      {agentName}
                    </h1>
                    <button
                      onClick={() => setIsNameEditing(true)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">ID: {agent.agent_id.substring(0, 6)}...{agent.agent_id.substring(agent.agent_id.length - 4)}</span>
                  <button
                    onClick={handleCopyId}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>

            </div>

            {/* Top Right Controls */}
            <div className="flex items-center space-x-3 ml-4">
              {/* Phone Control */}
              <div className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg">
                <Phone className="w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  value="-"
                  readOnly
                  className="text-sm text-gray-900 bg-transparent border-0 outline-0 w-8"
                />
                <button className="hover:bg-gray-100 rounded p-0.5 transition-colors cursor-pointer">
                  <SettingsIcon className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              {/* Tag Selection */}
              <div className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg">
                <Tag className="w-3 h-3 text-gray-400" />
                <select
                  defaultValue=""
                  className="text-sm font-medium text-gray-900 bg-transparent border-0 outline-0 cursor-pointer"
                >
                  <option value="">Select Tag</option>
                  <option value="support">Support</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                </select>
                <button className="hover:bg-gray-100 rounded p-0.5 transition-colors cursor-pointer">
                  <SettingsIcon className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              {/* Voice Selection */}
              <VoiceSelector
                voices={voices}
                value={voiceId}
                onChange={(voiceId) => {
                  setVoiceId(voiceId);
                  setIsSaved(false);
                }}
                onSettingsClick={voiceId ? () => setShowVoiceSettings(true) : undefined}
              />

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

            {/* Publish Error Message - Fixed position to avoid layout shift */}
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabs with Controls */}
          <div className="flex items-center justify-between px-6 border-t border-gray-200">
            <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer rounded-t-lg ${
                activeTab === 'builder'
                  ? 'bg-white text-gray-900 border border-b-0 border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Builder
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer rounded-t-lg ${
                activeTab === 'voice'
                  ? 'bg-white text-gray-900 border border-b-0 border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Voice Lab
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer rounded-t-lg ${
                activeTab === 'chat'
                  ? 'bg-white text-gray-900 border border-b-0 border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chat Lab
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer rounded-t-lg ${
                activeTab === 'knowledge'
                  ? 'bg-white text-gray-900 border border-b-0 border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Knowledge Lab
            </button>
            </div>

            {/* Controls row - Saved, GPT-4o, Icons, Issues */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>{agent && (agent as any).is_published ? 'Published' : 'Saved'}</span>
              </div>
              <select
                value={llmId}
                onChange={(e) => {
                  setLlmId(e.target.value);
                  setIsSaved(false);
                }}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
              <div className="flex items-center space-x-1">
                <FlaskConical className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <Users className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <Rocket className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              </div>
              <RotateCw className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span>0 issues</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            {activeTab === 'builder' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* Global Prompt Section Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4 flex-wrap gap-3">
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

                {/* Prompt textarea - fills remaining space */}
                <textarea
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder="Enter your prompt here..."
                  className="flex-1 w-full min-h-[500px] p-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none bg-white"
                />
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4">
                {/* Web Call Interface */}
                <WebCallInterface 
                  agentId={agentId}
                  agentName={agentName}
                  onCallStart={() => console.log('Call started')}
                  onCallEnd={() => console.log('Call ended')}
                />

                {/* Warning Message */}
                <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">Voice Lab allows you to test your agent with real web calls. Make sure to save your voice settings before testing.</p>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <ChatLabInterface agentId={agentId} agentName={agentName} />
            )}

            {activeTab === 'knowledge' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {/* Knowledge Lab Content */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Embedding playground</h3>
                    <p className="text-sm text-gray-600">Testing BLCO KNOWLEDGE</p>
                  </div>

                  {/* Examples */}
                  <div className="flex-1 space-y-4 overflow-y-auto mb-6 min-h-0">
                    {/* Example 1 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">¿Cómo funciona el servicio de entrega?</span>
                      </div>
                      <div className="ml-6 border-l-2 border-purple-500 pl-4">
                        <p className="text-sm text-gray-700 mb-2">
                          Nuestro servicio de entrega funciona dentro de un radio de 50km del centro de la ciudad. Los pedidos se entregan en 24-48 horas hábiles.
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Image className="w-4 h-4" />
                          <span>0% match -</span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Example 2 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">¿Cuáles son sus horarios de atención?</span>
                      </div>
                      <div className="ml-6 border-l-2 border-purple-500 pl-4">
                        <p className="text-sm text-gray-700 mb-2">
                          Atendemos de lunes a viernes de 9:00 AM a 7:00 PM, y los sábados de 10:00 AM a 2:00 PM. Los domingos cerrado.
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Image className="w-4 h-4" />
                          <span>0% match -</span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Example 3 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">¿Qué métodos de pago aceptan?</span>
                      </div>
                      <div className="ml-6 border-l-2 border-purple-500 pl-4">
                        <p className="text-sm text-gray-700 mb-2">
                          Aceptamos tarjetas de crédito (Visa, Mastercard, Amex), transferencia bancaria y efectivo para entregas locales.
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Image className="w-4 h-4" />
                          <span>0% match -</span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Example 4 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">¿Tienen garantía en sus productos?</span>
                      </div>
                      <div className="ml-6 border-l-2 border-purple-500 pl-4">
                        <p className="text-sm text-gray-700 mb-2">
                          Todos nuestros productos tienen garantía de 30 días. Si no estás satisfecho, puedes devolver el producto sin preguntas.
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Image className="w-4 h-4" />
                          <span>0% match -</span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Input Section */}
                  <div className="border-t border-gray-200 pt-4 mt-auto">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ask your knowledge base a question..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                        <RotateCw className="w-4 h-4" />
                        <span>reset memory</span>
                      </button>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors cursor-pointer">
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Tool Kit */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Tool Kit</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              {/* Tool Kit Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Chat Settings</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div 
                  onClick={() => setShowCallSettings(true)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Call Settings</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Tools & APIs</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Pencil className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Map Custom Fields</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Knowledge Base</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Calendars</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Find & Replace</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Team Notes</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Calendar Section */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">Calendar</h4>
                </div>
                <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">Residential Calender Ai</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Call Settings Modal */}
      <CallSettingsModal
        isOpen={showCallSettings}
        onClose={() => setShowCallSettings(false)}
        agent={agent || undefined}
        agentId={agentId}
        onSave={handleCallSettingsSave}
      />

      {/* Voice Settings Modal */}
        <VoiceSettingsModal
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          voiceModel={voiceModel}
          voiceTemperature={voiceTemperature}
          voiceSpeed={voiceSpeed}
          volume={volume}
          onSave={(settings) => {
            // Update local states without saving yet
            setVoiceModel(settings.voiceModel);
            setVoiceTemperature(settings.voiceTemperature);
            setVoiceSpeed(settings.voiceSpeed);
            setVolume(settings.volume);
            setIsSaved(false); // Activate Save Changes button
          }}
        />
    </DashboardLayout>
  );
}
