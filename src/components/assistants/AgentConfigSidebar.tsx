'use client';

import { useState, useEffect } from 'react';
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
  ChevronUp,
  Plus,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { RetellAgent } from '@/lib/retell';
import { RetellTool, RetellToolType, RetellToolParameter } from '@/types/retell-tools';

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

  // Estado para tools
  const [tools, setTools] = useState<RetellTool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const [editingToolIndex, setEditingToolIndex] = useState<number | null>(null);
  const [toolForm, setToolForm] = useState<Partial<RetellTool> & {
    type?: RetellToolType;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    query_params?: Record<string, string>;
    speak_after_execution?: boolean;
    speak_during_execution?: boolean;
    execution_message_description?: string;
    timeout_ms?: number;
    response_variables?: Record<string, string>;
    transfer_destination?: {
      type: 'predefined' | 'agent';
      number?: string;
      agent_id?: string;
      ignore_e164_validation?: boolean;
    };
    transfer_option?: {
      type: 'cold_transfer' | 'warm_transfer';
      show_transferee_as_caller?: boolean;
    };
    cal_api_key?: string;
    event_type_id?: number;
    timezone?: string;
    sms_content?: string;
  }>({
    type: 'custom' as RetellToolType,
    name: '',
    description: '',
    url: '',
    method: 'POST',
    headers: {},
    query_params: {},
    speak_after_execution: true,
    speak_during_execution: false,
    execution_message_description: '',
    timeout_ms: 120000,
    response_variables: {},
    webhook_url: '',
    parameters: [],
  });
  const [editingParameterIndex, setEditingParameterIndex] = useState<number | null>(null);
  const [parameterForm, setParameterForm] = useState<Partial<RetellToolParameter>>({
    name: '',
    type: 'string',
    description: '',
    required: false,
  });

  // Obtener LLM ID del agente
  const getLLMId = (): string | null => {
    if (!agent?.response_engine) return null;
    if ('llm_id' in agent.response_engine && agent.response_engine.llm_id) {
      return agent.response_engine.llm_id;
    }
    return null;
  };

  // Cargar tools cuando se expande la sección
  useEffect(() => {
    if (expandedSections.functions) {
      loadTools();
    }
  }, [expandedSections.functions, agent?.agent_id]);

  const loadTools = async () => {
    const llmId = getLLMId();
    if (!llmId) {
      setTools([]);
      return;
    }

    try {
      setIsLoadingTools(true);
      const response = await fetch(`/api/llms/${llmId}/tools`);
      const data = await response.json();
      
      if (data.success) {
        setTools(data.data || []);
      } else {
        console.error('Error loading tools:', data.error);
        setTools([]);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
      setTools([]);
    } finally {
      setIsLoadingTools(false);
    }
  };

  const handleAddTool = () => {
    setEditingToolIndex(null);
                    setToolForm({
                      type: 'custom' as RetellToolType,
                      name: '',
                      description: '',
                      url: '',
                      method: 'POST',
                      headers: {},
                      query_params: {},
                      speak_after_execution: true,
                      speak_during_execution: false,
                      execution_message_description: '',
                      timeout_ms: 120000,
                      response_variables: {},
                      webhook_url: '',
                      parameters: [],
                    });
    setParameterForm({
      name: '',
      type: 'string',
      description: '',
      required: false,
    });
    setEditingParameterIndex(null);
    setShowToolModal(true);
  };

  const handleEditTool = (index: number) => {
    setEditingToolIndex(index);
    setToolForm(tools[index]);
    setParameterForm({
      name: '',
      type: 'string',
      description: '',
      required: false,
    });
    setEditingParameterIndex(null);
    setShowToolModal(true);
  };

  const handleAddParameter = () => {
    setEditingParameterIndex(null);
    setParameterForm({
      name: '',
      type: 'string',
      description: '',
      required: false,
    });
  };

  const handleEditParameter = (index: number) => {
    const params = toolForm.parameters || [];
    setEditingParameterIndex(index);
    setParameterForm(params[index] || {
      name: '',
      type: 'string',
      description: '',
      required: false,
    });
  };

  const handleSaveParameter = () => {
    if (!parameterForm.name || !parameterForm.description) {
      alert('El nombre y la descripción del parámetro son requeridos');
      return;
    }

    const params = [...(toolForm.parameters || [])];
    const newParam: RetellToolParameter = {
      name: parameterForm.name!,
      type: parameterForm.type || 'string',
      description: parameterForm.description!,
      required: parameterForm.required || false,
      ...(parameterForm.enum && parameterForm.enum.length > 0 ? { enum: parameterForm.enum } : {}),
    };

    if (editingParameterIndex !== null) {
      params[editingParameterIndex] = newParam;
    } else {
      params.push(newParam);
    }

    setToolForm({ ...toolForm, parameters: params });
    setParameterForm({
      name: '',
      type: 'string',
      description: '',
      required: false,
    });
    setEditingParameterIndex(null);
  };

  const handleDeleteParameter = (index: number) => {
    const params = [...(toolForm.parameters || [])];
    params.splice(index, 1);
    setToolForm({ ...toolForm, parameters: params });
  };

  const handleCancelParameter = () => {
    setParameterForm({
      name: '',
      type: 'string',
      description: '',
      required: false,
    });
    setEditingParameterIndex(null);
  };

  const handleDeleteTool = async (index: number) => {
    const llmId = getLLMId();
    if (!llmId) return;

    if (!confirm('¿Estás seguro de que deseas eliminar este tool?')) {
      return;
    }

    try {
      const response = await fetch(`/api/llms/${llmId}/tools?toolIndex=${index}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await loadTools();
      } else {
        alert('Error al eliminar el tool: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Error al eliminar el tool');
    }
  };

  const handleSaveTool = async () => {
    const llmId = getLLMId();
    if (!llmId) {
      alert('El agente no tiene un LLM configurado');
      return;
    }

    if (!toolForm.name || !toolForm.description) {
      alert('El nombre y la descripción son requeridos');
      return;
    }

    const toolType = toolForm.type as RetellToolType;
    
    // Validaciones específicas por tipo
    if ((toolType === 'custom' || toolType === 'function') && !toolForm.url) {
      alert('La URL del endpoint es requerida para tools de tipo Custom/Function');
      return;
    }
    
    if ((toolType === 'custom' || toolType === 'function') && toolForm.speak_after_execution === undefined) {
      alert('Speak after execution es requerido para tools de tipo Custom/Function');
      return;
    }

    if (toolType === 'mcp' && !toolForm.url && !toolForm.webhook_url) {
      alert('La URL del webhook es requerida para tools de tipo MCP');
      return;
    }

    if (toolType === 'transfer_call') {
      if (!toolForm.transfer_destination) {
        alert('La configuración de destino es requerida para Transfer Call');
        return;
      }
      if (toolForm.transfer_destination.type === 'predefined' && !toolForm.transfer_destination.number) {
        alert('El número de teléfono es requerido para Transfer Call con destino predefinido');
        return;
      }
      if (toolForm.transfer_destination.type === 'agent' && !toolForm.transfer_destination.agent_id) {
        alert('El Agent ID es requerido para Transfer Call con destino agente');
        return;
      }
    }

    if (toolType === 'book_appointment_cal') {
      if (!toolForm.cal_api_key || !toolForm.event_type_id || !toolForm.timezone) {
        alert('Cal API Key, Event Type ID y Timezone son requeridos para Book Appointment Cal');
        return;
      }
    }

    // Convertir el tool al formato que Retell espera
    let toolToSave: any = {
      type: toolForm.type,
      name: toolForm.name,
      description: toolForm.description,
    };

    // Para tools tipo Custom/Function (HTTP) - Option 6
    if (toolType === 'custom' || toolType === 'function') {
      // Convertir 'function' a 'custom' según documentación Retell AI
      toolToSave.type = 'custom';
      toolToSave.url = toolForm.url;
      toolToSave.description = toolForm.description;
      toolToSave.speak_after_execution = toolForm.speak_after_execution ?? true;
      
      if (toolForm.method) {
        toolToSave.method = toolForm.method;
      }
      
      if (toolForm.headers && Object.keys(toolForm.headers).length > 0) {
        toolToSave.headers = toolForm.headers;
      }
      
      if (toolForm.query_params && Object.keys(toolForm.query_params).length > 0) {
        toolToSave.query_params = toolForm.query_params;
      }
      
      // Para custom tools, Retell espera parameters con schema JSON
      if (toolForm.parameters && toolForm.parameters.length > 0) {
        toolToSave.parameters = {
          type: 'object',
          properties: {},
          required: [] as string[],
        };
        toolForm.parameters.forEach((param: any) => {
          (toolToSave.parameters.properties as any)[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum && param.enum.length > 0 ? { enum: param.enum } : {}),
          };
          if (param.required) {
            toolToSave.parameters.required.push(param.name);
          }
        });
      }
      
      if (toolForm.speak_during_execution !== undefined) {
        toolToSave.speak_during_execution = toolForm.speak_during_execution;
      }
      
      if (toolForm.execution_message_description) {
        toolToSave.execution_message_description = toolForm.execution_message_description;
      }
      
      if (toolForm.timeout_ms && toolForm.timeout_ms >= 1000 && toolForm.timeout_ms <= 600000) {
        toolToSave.timeout_ms = toolForm.timeout_ms;
      }
      
      if (toolForm.response_variables && Object.keys(toolForm.response_variables).length > 0) {
        toolToSave.response_variables = toolForm.response_variables;
      }
    }

    // Para tools tipo MCP
    if (toolType === 'mcp') {
      toolToSave.url = toolForm.url || toolForm.webhook_url;
      
      // Convertir parameters a variables (formato que Retell espera)
      // Retell espera variables como: { "variable_name": "description" }
      if (toolForm.parameters && toolForm.parameters.length > 0) {
        const variables: Record<string, string> = {};
        toolForm.parameters.forEach(param => {
          variables[param.name] = param.description;
        });
        toolToSave.variables = variables;
      } else {
        toolToSave.variables = {};
      }
    }

    // Para tools tipo Transfer Call
    if (toolType === 'transfer_call') {
      toolToSave.transfer_destination = toolForm.transfer_destination;
      if (toolForm.transfer_option) {
        toolToSave.transfer_option = toolForm.transfer_option;
      }
    }

    // Para tools tipo Book Appointment Cal
    if (toolType === 'book_appointment_cal') {
      toolToSave.cal_api_key = toolForm.cal_api_key;
      toolToSave.event_type_id = toolForm.event_type_id;
      toolToSave.timezone = toolForm.timezone;
    }

    // Para tools tipo Press Digit
    if (toolType === 'press_digit' && toolForm.sms_content) {
      toolToSave.sms_content = toolForm.sms_content;
    }

    try {
      let response;
      if (editingToolIndex !== null) {
        // Actualizar tool existente
        response = await fetch(`/api/llms/${llmId}/tools`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolIndex: editingToolIndex,
            tool: toolToSave,
          }),
        });
      } else {
        // Agregar nuevo tool
        response = await fetch(`/api/llms/${llmId}/tools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: toolToSave }),
        });
      }

      const data = await response.json();

      if (data.success) {
        setShowToolModal(false);
                    setToolForm({
                      type: 'custom' as RetellToolType,
                      name: '',
                      description: '',
                      url: '',
                      method: 'POST',
                      headers: {},
                      query_params: {},
                      speak_after_execution: true,
                      speak_during_execution: false,
                      execution_message_description: '',
                      timeout_ms: 120000,
                      response_variables: {},
                      webhook_url: '',
                      parameters: [],
                    });
        setParameterForm({
          name: '',
          type: 'string',
          description: '',
          required: false,
        });
        setEditingParameterIndex(null);
        await loadTools();
      } else {
        alert('Error al guardar el tool: ' + data.error);
        console.log(data);
      }
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('Error al guardar el tool');
    }
  };

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
            
            {!getLLMId() && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  El agente debe tener un LLM configurado para usar tools.
                </p>
              </div>
            )}

            {isLoadingTools ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">Cargando tools...</p>
              </div>
            ) : (
              <>
                {tools.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tools.map((tool, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-start justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-900 truncate">
                              {tool.name}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                              {tool.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {tool.description}
                          </p>
                          {tool.parameters && tool.parameters.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tool.parameters.map((param, paramIndex) => (
                                <span
                                  key={paramIndex}
                                  className="text-xs text-gray-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded"
                                  title={`${param.name} (${param.type})${param.required ? ' - Requerido' : ''}`}
                                >
                                  {param.name}
                                  {param.required && <span className="text-red-500 ml-0.5">*</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleEditTool(index)}
                            className="p-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Editar tool"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTool(index)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar tool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAddTool}
                  disabled={!getLLMId()}
                  className="w-full px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Tool
                </button>
              </>
            )}
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

      {/* Modal para crear/editar tool */}
      {showToolModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingToolIndex !== null ? 'Editar Tool' : 'Agregar Tool'}
              </h3>
              <button
                onClick={() => {
                  setShowToolModal(false);
                    setToolForm({
                      type: 'custom' as RetellToolType,
                      name: '',
                      description: '',
                      url: '',
                      method: 'POST',
                      headers: {},
                      query_params: {},
                      speak_after_execution: true,
                      speak_during_execution: false,
                      execution_message_description: '',
                      timeout_ms: 120000,
                      response_variables: {},
                      webhook_url: '',
                      parameters: [],
                    });
                  setParameterForm({
                    name: '',
                    type: 'string',
                    description: '',
                    required: false,
                  });
                  setEditingParameterIndex(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Tool *
                </label>
                <select
                  value={toolForm.type || 'custom'}
                  onChange={(e) => {
                    const newType = e.target.value as RetellToolType;
                    // Resetear campos específicos cuando cambia el tipo
                    const resetForm: Partial<RetellTool> & {
                      type?: RetellToolType;
                      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
                      headers?: Record<string, string>;
                      query_params?: Record<string, string>;
                      speak_after_execution?: boolean;
                      speak_during_execution?: boolean;
                      execution_message_description?: string;
                      timeout_ms?: number;
                      response_variables?: Record<string, string>;
                      transfer_destination?: any;
                      transfer_option?: any;
                      cal_api_key?: string;
                      event_type_id?: number;
                      timezone?: string;
                      sms_content?: string;
                    } = {
                      type: newType,
                      name: toolForm.name || '',
                      description: toolForm.description || '',
                    };
                    
                    if (newType === 'mcp') {
                      resetForm.url = toolForm.webhook_url || '';
                    } else if (newType === 'custom' || newType === 'function') {
                      resetForm.url = '';
                      resetForm.method = 'POST';
                      resetForm.headers = {};
                      resetForm.query_params = {};
                      resetForm.speak_after_execution = true;
                      resetForm.speak_during_execution = false;
                      resetForm.execution_message_description = '';
                      resetForm.timeout_ms = 120000;
                      resetForm.response_variables = {};
                      resetForm.parameters = [];
                    } else if (newType === 'transfer_call') {
                      resetForm.transfer_destination = { type: 'predefined' };
                      resetForm.transfer_option = { type: 'cold_transfer' };
                    } else if (newType === 'book_appointment_cal') {
                      resetForm.cal_api_key = '';
                      resetForm.event_type_id = undefined;
                      resetForm.timezone = '';
                    } else if (newType === 'press_digit') {
                      resetForm.sms_content = '';
                    }
                    
                    setToolForm(resetForm);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="end_call">End Call</option>
                  <option value="custom">Custom Function (HTTP)</option>
                  {/* <option value="mcp">Custom Function (MCP)</option> */}
                  <option value="transfer_call">Transfer Call</option>
                  <option value="bridge_transfer">Bridge Transfer</option>
                  <option value="cancel_transfer">Cancel Transfer</option>
                  <option value="book_appointment_cal">Book Appointment (Cal.com)</option>
                  <option value="press_digit">Press Digit</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {(toolForm.type as RetellToolType) === 'custom' && 'Custom function tool con HTTP'}
                  {(toolForm.type as RetellToolType) === 'transfer_call' && 'Para transferir llamadas a otro número o agente'}
                  {(toolForm.type as RetellToolType) === 'book_appointment_cal' && 'Para agendar citas usando Cal.com'}
                  {!toolForm.type && 'Selecciona el tipo de tool'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={toolForm.name || ''}
                  onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                  placeholder="check_order_status"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre único del tool (sin espacios, usar snake_case)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={toolForm.description || ''}
                  onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
                  placeholder="Verificar el estado de una orden por su ID"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe qué hace el tool y cuándo debe usarse
                </p>
              </div>

              {/* Custom Function (HTTP) - Option 6 */}
              {((toolForm.type as RetellToolType) === 'custom' || (toolForm.type as RetellToolType) === 'function') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL del Endpoint *
                    </label>
                    <input
                      type="url"
                      value={toolForm.url || ''}
                      onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })}
                      placeholder="https://api.example.com/endpoint"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método HTTP
                    </label>
                    <select
                      value={toolForm.method || 'POST'}
                      onChange={(e) => setToolForm({ ...toolForm, method: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Default: POST
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Headers HTTP (JSON opcional)
                    </label>
                    <textarea
                      value={toolForm.headers ? JSON.stringify(toolForm.headers, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const headers = e.target.value ? JSON.parse(e.target.value) : {};
                          setToolForm({ ...toolForm, headers });
                        } catch {
                          // Ignorar JSON inválido mientras se escribe
                        }
                      }}
                      placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formato JSON con los headers HTTP a enviar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Query Parameters (JSON opcional)
                    </label>
                    <textarea
                      value={toolForm.query_params ? JSON.stringify(toolForm.query_params, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const queryParams = e.target.value ? JSON.parse(e.target.value) : {};
                          setToolForm({ ...toolForm, query_params: queryParams });
                        } catch {
                          // Ignorar JSON inválido mientras se escribe
                        }
                      }}
                      placeholder='{"page": "1", "sort": "asc"}'
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Query parameters a agregar a la URL
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Speak After Execution *
                      </label>
                      <p className="text-xs text-gray-500">
                        El agente llamará al LLM nuevamente y hablará cuando se obtenga el resultado
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={toolForm.speak_after_execution ?? true}
                      onChange={(e) => setToolForm({ ...toolForm, speak_after_execution: e.target.checked })}
                      className="w-4 h-4 text-purple-600"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Speak During Execution
                      </label>
                      <p className="text-xs text-gray-500">
                        El agente dirá algo como "Un momento, déjame verificar eso" durante la ejecución
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={toolForm.speak_during_execution ?? false}
                      onChange={(e) => setToolForm({ ...toolForm, speak_during_execution: e.target.checked })}
                      className="w-4 h-4 text-purple-600"
                    />
                  </div>

                  {toolForm.speak_during_execution && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Execution Message Description
                      </label>
                      <textarea
                        value={toolForm.execution_message_description || ''}
                        onChange={(e) => setToolForm({ ...toolForm, execution_message_description: e.target.value })}
                        placeholder="El mensaje que el agente dirá al llamar este tool. Asegúrate de que encaje suavemente en la conversación."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Descripción del mensaje que el agente dirá durante la ejecución
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (ms)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="600000"
                      step="1000"
                      value={toolForm.timeout_ms || 120000}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1000 && value <= 600000) {
                          setToolForm({ ...toolForm, timeout_ms: value });
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tiempo máximo en milisegundos (1000-600000, default: 120000 = 2 min)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Response Variables (JSON opcional)
                    </label>
                    <textarea
                      value={toolForm.response_variables ? JSON.stringify(toolForm.response_variables, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const responseVars = e.target.value ? JSON.parse(e.target.value) : {};
                          setToolForm({ ...toolForm, response_variables: responseVars });
                        } catch {
                          // Ignorar JSON inválido mientras se escribe
                        }
                      }}
                      placeholder='{"user_name": "data.user.name", "order_status": "data.status"}'
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mapeo de nombres de variables a JSON paths en la respuesta. Estos valores estarán disponibles como variables dinámicas.
                    </p>
                  </div>
                </>
              )}

              {/* MCP Tool */}
              {(toolForm.type as RetellToolType) === 'mcp' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL *
                    </label>
                    <input
                      type="url"
                      value={toolForm.url || toolForm.webhook_url || ''}
                      onChange={(e) => {
                        setToolForm({ 
                          ...toolForm, 
                          url: e.target.value,
                          webhook_url: e.target.value // Mantener compatibilidad
                        });
                      }}
                      placeholder="https://tu-api.com/webhook/tools"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL que se llamará cuando el agente use este tool (MCP endpoint)
                    </p>
                  </div>
                </>
              )}

              {/* Transfer Call */}
              {(toolForm.type as RetellToolType) === 'transfer_call' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Destino *
                    </label>
                    <select
                      value={toolForm.transfer_destination?.type || 'predefined'}
                      onChange={(e) => {
                        setToolForm({
                          ...toolForm,
                          transfer_destination: {
                            type: e.target.value as 'predefined' | 'agent',
                            number: toolForm.transfer_destination?.number,
                            agent_id: toolForm.transfer_destination?.agent_id,
                            ignore_e164_validation: toolForm.transfer_destination?.ignore_e164_validation,
                          }
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="predefined">Número Predefinido</option>
                      <option value="agent">Agente</option>
                    </select>
                  </div>

                  {toolForm.transfer_destination?.type === 'predefined' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={toolForm.transfer_destination?.number || ''}
                        onChange={(e) => {
                          setToolForm({
                            ...toolForm,
                            transfer_destination: {
                              ...toolForm.transfer_destination!,
                              number: e.target.value,
                            }
                          });
                        }}
                        placeholder="+14157774444"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {toolForm.transfer_destination?.type === 'agent' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agent ID *
                      </label>
                      <input
                        type="text"
                        value={toolForm.transfer_destination?.agent_id || ''}
                        onChange={(e) => {
                          setToolForm({
                            ...toolForm,
                            transfer_destination: {
                              ...toolForm.transfer_destination!,
                              agent_id: e.target.value,
                            }
                          });
                        }}
                        placeholder="agent_id"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Transferencia
                    </label>
                    <select
                      value={toolForm.transfer_option?.type || 'cold_transfer'}
                      onChange={(e) => {
                        setToolForm({
                          ...toolForm,
                          transfer_option: {
                            type: e.target.value as 'cold_transfer' | 'warm_transfer',
                            show_transferee_as_caller: toolForm.transfer_option?.show_transferee_as_caller,
                          }
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="cold_transfer">Cold Transfer</option>
                      <option value="warm_transfer">Warm Transfer</option>
                    </select>
                  </div>
                </>
              )}

              {/* Book Appointment Cal */}
              {(toolForm.type as RetellToolType) === 'book_appointment_cal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cal.com API Key *
                    </label>
                    <input
                      type="text"
                      value={toolForm.cal_api_key || ''}
                      onChange={(e) => setToolForm({ ...toolForm, cal_api_key: e.target.value })}
                      placeholder="cal_live_xxxxxxxxxxxx"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type ID *
                    </label>
                    <input
                      type="number"
                      value={toolForm.event_type_id || ''}
                      onChange={(e) => setToolForm({ ...toolForm, event_type_id: parseInt(e.target.value) || undefined })}
                      placeholder="60444"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone *
                    </label>
                    <input
                      type="text"
                      value={toolForm.timezone || ''}
                      onChange={(e) => setToolForm({ ...toolForm, timezone: e.target.value })}
                      placeholder="America/Los_Angeles"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {/* Press Digit */}
              {(toolForm.type as RetellToolType) === 'press_digit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMS Content (Opcional)
                  </label>
                  <textarea
                    value={toolForm.sms_content || ''}
                    onChange={(e) => setToolForm({ ...toolForm, sms_content: e.target.value })}
                    placeholder="Contenido del SMS"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Parámetros para custom/function y mcp */}
              {((toolForm.type as RetellToolType) === 'custom' || (toolForm.type as RetellToolType) === 'function' || (toolForm.type as RetellToolType) === 'mcp') && (
                <>
                  {/* Parámetros */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Parámetros
                      </label>
                      <button
                        onClick={handleAddParameter}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Parámetro
                      </button>
                    </div>

                    {/* Lista de parámetros */}
                    {toolForm.parameters && toolForm.parameters.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {toolForm.parameters.map((param, index) => (
                          <div
                            key={index}
                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-start justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-900">
                                  {param.name}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                                  {param.type}
                                </span>
                                {param.required && (
                                  <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                    Requerido
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {param.description}
                              </p>
                              {param.enum && param.enum.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Valores: {param.enum.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleEditParameter(index)}
                                className="p-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="Editar parámetro"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteParameter(index)}
                                className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar parámetro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario de parámetro */}
                    {(editingParameterIndex !== null || (toolForm.parameters && toolForm.parameters.length === 0)) && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {editingParameterIndex !== null ? 'Editar Parámetro' : 'Nuevo Parámetro'}
                          </h4>
                          {editingParameterIndex !== null && (
                            <button
                              onClick={handleCancelParameter}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={parameterForm.name || ''}
                            onChange={(e) => setParameterForm({ ...parameterForm, name: e.target.value })}
                            placeholder="order_id"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo *
                          </label>
                          <select
                            value={parameterForm.type || 'string'}
                            onChange={(e) => setParameterForm({ ...parameterForm, type: e.target.value as RetellToolParameter['type'] })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="object">Object</option>
                            <option value="array">Array</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descripción *
                          </label>
                          <textarea
                            value={parameterForm.description || ''}
                            onChange={(e) => setParameterForm({ ...parameterForm, description: e.target.value })}
                            placeholder="El ID de la orden a verificar"
                            rows={2}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-700">
                            Requerido
                          </label>
                          <input
                            type="checkbox"
                            checked={parameterForm.required || false}
                            onChange={(e) => setParameterForm({ ...parameterForm, required: e.target.checked })}
                            className="w-4 h-4 text-purple-600"
                          />
                        </div>

                        {(parameterForm.type === 'string' || parameterForm.type === 'number') && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Valores Permitidos (Enum) - Opcional
                            </label>
                            <input
                              type="text"
                              value={parameterForm.enum ? parameterForm.enum.join(', ') : ''}
                              onChange={(e) => {
                                const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                                setParameterForm({ 
                                  ...parameterForm, 
                                  enum: values.length > 0 ? values : undefined 
                                });
                              }}
                              placeholder="valor1, valor2, valor3"
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Separa los valores con comas
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveParameter}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                          >
                            {editingParameterIndex !== null ? 'Actualizar' : 'Agregar'}
                          </button>
                          {editingParameterIndex !== null && (
                            <button
                              onClick={handleCancelParameter}
                              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowToolModal(false);
                    setToolForm({
                      type: 'function' as RetellToolType,
                      name: '',
                      description: '',
                      url: '',
                      method: 'POST',
                      headers: {},
                      webhook_url: '',
                      parameters: [],
                    });
                    setParameterForm({
                      name: '',
                      type: 'string',
                      description: '',
                      required: false,
                    });
                    setEditingParameterIndex(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTool}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingToolIndex !== null ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

