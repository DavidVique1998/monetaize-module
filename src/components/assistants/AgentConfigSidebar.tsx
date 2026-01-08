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
import { KnowledgeBase } from '@/types/knowledge-base';
import { Button } from '../ui/button';

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
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-none"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground/70" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
        )}
      </Button>
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
  
  // Estado para Knowledge Bases
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoadingKnowledgeBases, setIsLoadingKnowledgeBases] = useState(false);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>(null);
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
  // Post-call analysis state
  const [postCallForm, setPostCallForm] = useState<{
    type: 'string' | 'enum' | 'boolean' | 'number';
    name: string;
    description: string;
    examples: string;
    choices: string;
  }>({
    type: 'string',
    name: '',
    description: '',
    examples: '',
    choices: '',
  });
  const [editingPostCallIndex, setEditingPostCallIndex] = useState<number | null>(null);

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

  // Cargar Knowledge Bases cuando se expande la sección
  useEffect(() => {
    if (expandedSections.knowledgeBase) {
      loadKnowledgeBases();
      loadLLMKnowledgeBase();
    }
  }, [expandedSections.knowledgeBase, agent?.agent_id]);

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

  const loadKnowledgeBases = async () => {
    try {
      setIsLoadingKnowledgeBases(true);
      const response = await fetch('/api/knowledge-bases');
      const data = await response.json();
      
      if (data.success) {
        setKnowledgeBases(data.data || []);
      } else {
        console.error('Error loading knowledge bases:', data.error);
        setKnowledgeBases([]);
      }
    } catch (error) {
      console.error('Error loading knowledge bases:', error);
      setKnowledgeBases([]);
    } finally {
      setIsLoadingKnowledgeBases(false);
    }
  };

  const loadLLMKnowledgeBase = async () => {
    const llmId = getLLMId();
    if (!llmId) {
      setSelectedKnowledgeBaseId(null);
      return;
    }

    try {
      const response = await fetch(`/api/llms/${llmId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // El LLM puede tener knowledge_base_id o knowledge_base_ids
        const kbId = (data.data as any).knowledge_base_id || (data.data as any).knowledge_base_ids?.[0] || null;
        setSelectedKnowledgeBaseId(kbId);
      }
    } catch (error) {
      console.error('Error loading LLM knowledge base:', error);
    }
  };

  const handleKnowledgeBaseChange = async (knowledgeBaseId: string | null) => {
    const llmId = getLLMId();
    if (!llmId) {
      alert('El agente no tiene un LLM configurado');
      return;
    }

    try {
      const response = await fetch(`/api/llms/${llmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledge_base_id: knowledgeBaseId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedKnowledgeBaseId(knowledgeBaseId);
        // Notificar cambio al componente padre
        onSettingsChange({ knowledge_base_id: knowledgeBaseId });
      } else {
        alert('Error al actualizar Knowledge Base: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      alert('Error al actualizar Knowledge Base');
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

  // Post-call analysis handlers
  const handleAddPostCallEntry = () => {
    setEditingPostCallIndex(null);
    setPostCallForm({
      type: 'string',
      name: '',
      description: '',
      examples: '',
      choices: '',
    });
  };

  const handleEditPostCallEntry = (index: number, data: any[]) => {
    const item = data[index];
    setEditingPostCallIndex(index);
    setPostCallForm({
      type: (item?.type as 'string' | 'enum' | 'boolean' | 'number') || 'string',
      name: item?.name || '',
      description: item?.description || '',
      examples: Array.isArray(item?.examples) ? item.examples.join(', ') : '',
      choices: Array.isArray(item?.choices) ? item.choices.join(', ') : '',
    });
  };

  const handleDeletePostCallEntry = (index: number, data: any[]) => {
    const updated = [...data];
    updated.splice(index, 1);
    onSettingsChange({ post_call_analysis_data: updated });
    setEditingPostCallIndex(null);
    setPostCallForm({
      type: 'string',
      name: '',
      description: '',
      examples: '',
      choices: '',
    });
  };

  const handleSavePostCallEntry = (data: any[]) => {
    if (!postCallForm.name || !postCallForm.description) {
      alert('Nombre y descripción son requeridos');
      return;
    }
    const examplesArr = postCallForm.examples
      ? postCallForm.examples.split(',').map((e) => e.trim()).filter(Boolean)
      : [];
    const choicesArr = postCallForm.choices
      ? postCallForm.choices.split(',').map((e) => e.trim()).filter(Boolean)
      : [];

    let newEntry: any = {
      type: postCallForm.type,
      name: postCallForm.name,
      description: postCallForm.description,
    };

    if (postCallForm.type === 'string' && examplesArr.length > 0) {
      newEntry.examples = examplesArr;
    }

    if (postCallForm.type === 'enum') {
      if (choicesArr.length === 0) {
        alert('Las opciones (choices) son requeridas para tipo enum');
        return;
      }
      newEntry.choices = choicesArr;
    }
    const updated = [...data];
    if (editingPostCallIndex !== null) {
      updated[editingPostCallIndex] = newEntry;
    } else {
      updated.push(newEntry);
    }
    onSettingsChange({ post_call_analysis_data: updated });
    setEditingPostCallIndex(null);
    setPostCallForm({
      type: 'string',
      name: '',
      description: '',
      examples: '',
      choices: '',
    });
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

    if (toolType === 'check_availability_cal') {
      if (!toolForm.cal_api_key || !toolForm.event_type_id) {
        alert('Cal API Key y Event Type ID son requeridos para Check Availability Cal');
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

    // Para tools tipo Check Availability Cal
    if (toolType === 'check_availability_cal') {
      toolToSave.cal_api_key = toolForm.cal_api_key;
      toolToSave.event_type_id = toolForm.event_type_id;
      if (toolForm.timezone) {
        toolToSave.timezone = toolForm.timezone;
      }
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
    <div className="w-80 bg-card border-l border-gray-200 overflow-y-auto">
  

      {/* Configuration Sections */}
      <div className="divide-y divide-gray-200">
        {/* Functions */}
        <ConfigSection
          title="Functions"
          icon={<Grid3x3 className="w-4 h-4 text-muted-foreground" />}
          isExpanded={expandedSections.functions}
          onToggle={() => toggleSection('functions')}
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Configure function calling capabilities for your agent.
            </p>
            
            {!getLLMId() && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  El agente debe tener un LLM configurado para usar tools.
                </p>
              </div>
            )}

            {isLoadingTools ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">Cargando tools...</p>
              </div>
            ) : (
              <>
                {tools.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tools.map((tool, index) => (
                      <div
                        key={index}
                        className="p-2 bg-muted/30 border border-gray-200 rounded-lg flex items-start justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground truncate">
                              {tool.name}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {tool.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tool.description}
                          </p>
                          {tool.parameters && tool.parameters.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tool.parameters.map((param, paramIndex) => (
                                <span
                                  key={paramIndex}
                                  className="text-xs text-muted-foreground bg-blue-50 border border-primary/20 px-1.5 py-0.5 rounded"
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTool(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-purple-50"
                            title="Editar tool"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTool(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            title="Eliminar tool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline-primary"
                  onClick={handleAddTool}
                  disabled={!getLLMId()}
                >
                  <Plus className="w-4 h-4" />
                  Agregar Tool
                </Button>
              </>
            )}
          </div>
        </ConfigSection>

        {/* Knowledge Base */}
        <ConfigSection
          title="Knowledge Base"
          icon={<BookOpen className="w-4 h-4 text-muted-foreground" />}
          isExpanded={expandedSections.knowledgeBase}
          onToggle={() => toggleSection('knowledgeBase')}
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Conecta una Knowledge Base para proporcionar contexto a tu agente.
            </p>
            
            {!getLLMId() && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  El agente debe tener un LLM configurado para usar Knowledge Bases.
                </p>
              </div>
            )}

            {isLoadingKnowledgeBases ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">Cargando Knowledge Bases...</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Knowledge Base
                  </label>
                  <select
                    value={selectedKnowledgeBaseId || ''}
                    onChange={(e) => handleKnowledgeBaseChange(e.target.value || null)}
                    disabled={!getLLMId()}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Ninguna</option>
                    {knowledgeBases.map((kb) => (
                      <option key={kb.knowledge_base_id} value={kb.knowledge_base_id}>
                        {kb.knowledge_base_name} {kb.status !== 'complete' && `(${kb.status})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona una Knowledge Base para asociarla con este agente
                  </p>
                </div>

                {knowledgeBases.length === 0 && (
                  <div className="p-2 bg-muted/30 border border-gray-200 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      No hay Knowledge Bases disponibles. Crea una en la página de Knowledge Bases.
                    </p>
                    <a
                      href="/knowledge"
                      className="text-xs text-primary hover:text-primary/80 underline"
                    >
                      Ir a Knowledge Bases →
                    </a>
                  </div>
                )}

                {selectedKnowledgeBaseId && (
                  <div className="p-2 bg-emerald-600/10 border border-emerald-600/20 rounded-lg">
                    <p className="text-xs text-emerald-400">
                      ✓ Knowledge Base conectada correctamente
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </ConfigSection>

        {/* Speech Settings */}
        <ConfigSection
          title="Speech Settings"
          icon={<Volume2 className="w-4 h-4 text-muted-foreground" />}
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
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
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
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
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
                className="w-4 h-4 text-primary"
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
          icon={<Mic className="w-4 h-4 text-muted-foreground" />}
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
          icon={<Phone className="w-4 h-4 text-muted-foreground" />}
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-4 h-4 text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Ambient Sound
              </label>
              <select
                value={getValue('ambient_sound', null) || 'null'}
                onChange={(e) => onSettingsChange({ ambient_sound: e.target.value === 'null' ? null : e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
          isExpanded={expandedSections.postCallExtraction}
          onToggle={() => toggleSection('postCallExtraction')}
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Configure data extraction after calls complete.
            </p>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-2">
                Analysis Model
              </label>
              <select
                value={getValue('post_call_analysis_model', 'gpt-4.1-mini')}
                onChange={(e) => onSettingsChange({ post_call_analysis_model: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                <option value="gpt-5">gpt-5</option>
                <option value="gpt-5-mini">gpt-5-mini</option>
                <option value="gpt-5-nano">gpt-5-nano</option>
                <option value="claude-4.5-sonnet">claude-4.5-sonnet</option>
                <option value="claude-4.5-haiku">claude-4.5-haiku</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
              </select>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Success Prompt (opcional)
                </label>
                <textarea
                  value={getValue('analysis_successful_prompt', '') || ''}
                  onChange={(e) => onSettingsChange({ analysis_successful_prompt: e.target.value })}
                  rows={2}
                  placeholder="The agent finished the task and the call was complete without being cutoff."
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Summary Prompt (opcional)
                </label>
                <textarea
                  value={getValue('analysis_summary_prompt', '') || ''}
                  onChange={(e) => onSettingsChange({ analysis_summary_prompt: e.target.value })}
                  rows={2}
                  placeholder="Summarize the call in a few sentences."
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Campos a extraer</h4>
                  <p className="text-xs text-muted-foreground">Define variables adicionales que quieres obtener del análisis.</p>
                </div>
                <Button
                  variant="outline-primary"
                  onClick={handleAddPostCallEntry}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </Button>
              </div>

              {Array.isArray(getValue('post_call_analysis_data', [])) && getValue('post_call_analysis_data', []).length > 0 && (
                <div className="space-y-2">
                  {getValue('post_call_analysis_data', []).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-2 bg-card border border-gray-200 rounded-lg flex items-start justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {item.type || 'string'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        {Array.isArray(item.examples) && item.examples.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Ejemplos: {item.examples.join(', ')}
                          </p>
                        )}
                        {Array.isArray(item.choices) && item.choices.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Choices: {item.choices.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEditPostCallEntry(index, getValue('post_call_analysis_data', []))}
                          className="p-1 text-muted-foreground hover:text-primary hover:bg-purple-50 rounded transition-colors"
                          title="Editar campo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDeletePostCallEntry(index, getValue('post_call_analysis_data', []))}
                          variant="outline-error"
                          title="Eliminar campo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(editingPostCallIndex !== null || getValue('post_call_analysis_data', []).length === 0) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      {editingPostCallIndex !== null ? 'Editar campo' : 'Nuevo campo'}
                    </h4>
                    {editingPostCallIndex !== null && (
                      <Button
                        variant="outline-error"
                        onClick={() => {
                          setEditingPostCallIndex(null);
                          setPostCallForm({
                            type: 'string',
                            name: '',
                            description: '',
                            examples: '',
                            choices: '',
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Tipo *</label>
                      <select
                        value={postCallForm.type}
                        onChange={(e) => setPostCallForm({ ...postCallForm, type: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="string">string</option>
                        <option value="enum">enum</option>
                        <option value="boolean">boolean</option>
                        <option value="number">number</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={postCallForm.name}
                        onChange={(e) => setPostCallForm({ ...postCallForm, name: e.target.value })}
                        placeholder="customer_name"
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Descripción *</label>
                      <textarea
                        value={postCallForm.description}
                        onChange={(e) => setPostCallForm({ ...postCallForm, description: e.target.value })}
                        rows={2}
                        placeholder="The name of the customer."
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    {(postCallForm.type === 'string') && (
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Ejemplos (opcional)</label>
                        <input
                          type="text"
                          value={postCallForm.examples}
                          onChange={(e) => setPostCallForm({ ...postCallForm, examples: e.target.value })}
                          placeholder="John Doe, Jane Smith"
                          className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">Separa por comas.</p>
                      </div>
                    )}
                    {postCallForm.type === 'enum' && (
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">Choices (requerido)</label>
                        <input
                          type="text"
                          value={postCallForm.choices}
                          onChange={(e) => setPostCallForm({ ...postCallForm, choices: e.target.value })}
                          placeholder="good, bad"
                          className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">Lista de valores permitidos, separados por comas.</p>
                      </div>
                    )}
                    {(postCallForm.type === 'boolean' || postCallForm.type === 'number') && (
                      <p className="text-[11px] text-muted-foreground">
                        Para boolean/number no se requieren ejemplos ni choices.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleSavePostCallEntry(getValue('post_call_analysis_data', []))}
                      className="inline-flex items-center justify-center flex-1 h-8 px-4 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-semibold"
                    >
                      {editingPostCallIndex !== null ? 'Actualizar' : 'Agregar'}
                    </Button>
                    <Button
                      variant="outline-error"
                      onClick={() => {
                        setEditingPostCallIndex(null);
                        setPostCallForm({
                          type: 'string',
                          name: '',
                          description: '',
                          examples: '',
                          choices: '',
                        });
                      }}
                      className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-semibold"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ConfigSection>

        {/* Security & Fallback Settings */}
        <ConfigSection
          title="Security & Fallback Settings"
          icon={<Shield className="w-4 h-4 text-muted-foreground" />}
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-4 h-4 text-primary"
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
                className="w-4 h-4 text-primary"
              />
            </div>
          </div>
        </ConfigSection>

        {/* Webhook Settings */}
        <ConfigSection
          title="Webhook Settings"
          icon={<Globe className="w-4 h-4 text-muted-foreground" />}
          isExpanded={expandedSections.webhookSettings}
          onToggle={() => toggleSection('webhookSettings')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              {(() => {
                const currentWebhookUrl = getValue('webhook_url', '');
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
                const defaultWebhookUrl = `${baseUrl}/api/webhooks/retell`;
                const isUsingDefault = !currentWebhookUrl || currentWebhookUrl === defaultWebhookUrl;
                const displayUrl = isUsingDefault ? defaultWebhookUrl : currentWebhookUrl;
                
                return (
                  <>
                    <div className="relative">
              <input
                type="url"
                        value={displayUrl}
                onChange={(e) => onSettingsChange({ webhook_url: e.target.value })}
                        placeholder={defaultWebhookUrl}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                          isUsingDefault 
                            ? 'border-input bg-muted/30 text-muted-foreground' 
                            : 'border-input bg-card'
                        }`}
                      />
                      {isUsingDefault && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Por defecto
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isUsingDefault 
                        ? 'Usando el webhook por defecto de la aplicación. Las llamadas se registrarán automáticamente en el Call History.'
                        : 'Webhook personalizado configurado. Puedes dejarlo vacío para usar el webhook por defecto.'}
                    </p>
                    {!isUsingDefault && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onSettingsChange({ webhook_url: '' })}
                        className="mt-2 h-auto p-0 text-xs text-primary hover:text-primary/80 underline"
                      >
                        Restaurar webhook por defecto
                      </Button>
                    )}
                  </>
                );
              })()}
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
                className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tiempo máximo de espera para la respuesta del webhook (1000-30000 ms)
              </p>
            </div>
          </div>
        </ConfigSection>

        {/* MCPs */}
        <ConfigSection
          title="MCPs"
          icon={<Link2 className="w-4 h-4 text-muted-foreground" />}
          isExpanded={expandedSections.mcps}
          onToggle={() => toggleSection('mcps')}
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Configure Model Context Protocol connections.
            </p>
            <Button 
              variant="default"
              className="w-full"
            >
              Add MCP Connection
            </Button>
          </div>
        </ConfigSection>
      </div>

      {/* Modal para crear/editar tool */}
      {showToolModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {editingToolIndex !== null ? 'Editar Tool' : 'Agregar Tool'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
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
                className="text-muted-foreground/70 hover:text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
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
                    } else if (newType === 'book_appointment_cal' || newType === 'check_availability_cal') {
                      resetForm.cal_api_key = '';
                      resetForm.event_type_id = undefined;
                      resetForm.timezone = '';
                    } else if (newType === 'press_digit') {
                      resetForm.sms_content = '';
                    }
                    
                    setToolForm(resetForm);
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="end_call">End Call</option>
                  <option value="custom">Custom Function (HTTP)</option>
                  {/* <option value="mcp">Custom Function (MCP)</option> */}
                  <option value="transfer_call">Transfer Call</option>
                  <option value="bridge_transfer">Bridge Transfer</option>
                  <option value="cancel_transfer">Cancel Transfer</option>
                  <option value="book_appointment_cal">Book Appointment (Cal.com)</option>
                  <option value="check_availability_cal">Check Availability (Cal.com)</option>
                  <option value="press_digit">Press Digit</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {(toolForm.type as RetellToolType) === 'custom' && 'Custom function tool con HTTP'}
                  {(toolForm.type as RetellToolType) === 'transfer_call' && 'Para transferir llamadas a otro número o agente'}
                  {(toolForm.type as RetellToolType) === 'book_appointment_cal' && 'Para agendar citas usando Cal.com'}
                  {(toolForm.type as RetellToolType) === 'check_availability_cal' && 'Consultar disponibilidad en Cal.com antes de reservar'}
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
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
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
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Describe qué hace el tool y cuándo debe usarse
                </p>
              </div>

              {/* Custom Function (HTTP) - Option 6 */}
              {((toolForm.type as RetellToolType) === 'custom' || (toolForm.type as RetellToolType) === 'function') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      URL del Endpoint *
                    </label>
                    <input
                      type="url"
                      value={toolForm.url || ''}
                      onChange={(e) => setToolForm({ ...toolForm, url: e.target.value })}
                      placeholder="https://api.example.com/endpoint"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
                      Método HTTP
                    </label>
                    <select
                      value={toolForm.method || 'POST'}
                      onChange={(e) => setToolForm({ ...toolForm, method: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: POST
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formato JSON con los headers HTTP a enviar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Query parameters a agregar a la URL
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-input">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Speak After Execution *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        El agente llamará al LLM nuevamente y hablará cuando se obtenga el resultado
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={toolForm.speak_after_execution ?? true}
                      onChange={(e) => setToolForm({ ...toolForm, speak_after_execution: e.target.checked })}
                      className="w-4 h-4 text-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-input">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Speak During Execution
                      </label>
                      <p className="text-xs text-muted-foreground">
                        El agente dirá algo como "Un momento, déjame verificar eso" durante la ejecución
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={toolForm.speak_during_execution ?? false}
                      onChange={(e) => setToolForm({ ...toolForm, speak_during_execution: e.target.checked })}
                      className="w-4 h-4 text-primary"
                    />
                  </div>

                  {toolForm.speak_during_execution && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Execution Message Description
                      </label>
                      <textarea
                        value={toolForm.execution_message_description || ''}
                        onChange={(e) => setToolForm({ ...toolForm, execution_message_description: e.target.value })}
                        placeholder="El mensaje que el agente dirá al llamar este tool. Asegúrate de que encaje suavemente en la conversación."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Descripción del mensaje que el agente dirá durante la ejecución
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tiempo máximo en milisegundos (1000-600000, default: 120000 = 2 min)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="cold_transfer">Cold Transfer</option>
                      <option value="warm_transfer">Warm Transfer</option>
                    </select>
                  </div>
                </>
              )}

              {/* Book/Check Availability Cal */}
              {(['book_appointment_cal', 'check_availability_cal'] as RetellToolType[]).includes(toolForm.type as RetellToolType) && (
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone {toolForm.type === 'book_appointment_cal' ? '*' : '(opcional)'}
                    </label>
                    <input
                      type="text"
                      value={toolForm.timezone || ''}
                      onChange={(e) => setToolForm({ ...toolForm, timezone: e.target.value })}
                      placeholder="America/Los_Angeles"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {toolForm.type === 'check_availability_cal' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Si no se especifica, se usará la zona horaria del usuario o de Retell.
                      </p>
                    )}
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
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleAddParameter}
                        className="h-auto p-0 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Parámetro
                      </Button>
                    </div>

                    {/* Lista de parámetros */}
                    {toolForm.parameters && toolForm.parameters.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {toolForm.parameters.map((param, index) => (
                          <div
                            key={index}
                            className="p-2 bg-muted/30 border border-gray-200 rounded-lg flex items-start justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">
                                  {param.name}
                                </span>
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {param.type}
                                </span>
                                {param.required && (
                                  <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                    Requerido
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {param.description}
                              </p>
                              {param.enum && param.enum.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Valores: {param.enum.join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditParameter(index)}
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-purple-50"
                                title="Editar parámetro"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteParameter(index)}
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                title="Eliminar parámetro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario de parámetro */}
                    {(editingParameterIndex !== null || (toolForm.parameters && toolForm.parameters.length === 0)) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">
                            {editingParameterIndex !== null ? 'Editar Parámetro' : 'Nuevo Parámetro'}
                          </h4>
                          {editingParameterIndex !== null && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelParameter}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            value={parameterForm.name || ''}
                            onChange={(e) => setParameterForm({ ...parameterForm, name: e.target.value })}
                            placeholder="order_id"
                            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Tipo *
                          </label>
                          <select
                            value={parameterForm.type || 'string'}
                            onChange={(e) => setParameterForm({ ...parameterForm, type: e.target.value as RetellToolParameter['type'] })}
                            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="object">Object</option>
                            <option value="array">Array</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Descripción *
                          </label>
                          <textarea
                            value={parameterForm.description || ''}
                            onChange={(e) => setParameterForm({ ...parameterForm, description: e.target.value })}
                            placeholder="El ID de la orden a verificar"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-foreground">
                            Requerido
                          </label>
                          <input
                            type="checkbox"
                            checked={parameterForm.required || false}
                            onChange={(e) => setParameterForm({ ...parameterForm, required: e.target.checked })}
                            className="w-4 h-4 text-primary"
                          />
                        </div>

                        {(parameterForm.type === 'string' || parameterForm.type === 'number') && (
                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
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
                              className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Separa los valores con comas
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveParameter}
                            className="flex-1"
                          >
                            {editingParameterIndex !== null ? 'Actualizar' : 'Agregar'}
                          </Button>
                          {editingParameterIndex !== null && (
                            <Button
                              variant="outline"
                              onClick={handleCancelParameter}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
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
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveTool}
                  className="flex-1"
                >
                  {editingToolIndex !== null ? 'Actualizar' : 'Agregar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

