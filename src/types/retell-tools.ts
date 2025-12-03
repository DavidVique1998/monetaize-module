/**
 * Tipos para Tools/Functions en Retell AI
 * Basado en la documentación de Retell AI
 */

/**
 * Tipos de tools disponibles en Retell AI
 * Según la API de Retell, los tipos válidos son:
 * - end_call: Terminar la llamada
 * - mcp: Model Context Protocol (para custom tools con webhook)
 * - bridge_transfer: Transferir llamada (requiere transfer_destination, cal_api_key, agent_id)
 * - cancel_transfer: Cancelar transferencia
 * - press_digit: Presionar dígitos (requiere sms_content)
 */
export type RetellToolType = 
  | 'end_call'           // Terminar la llamada
  | 'mcp'                // Custom tool usando MCP (para funciones personalizadas con webhook)
  | 'bridge_transfer'    // Transferir llamada
  | 'cancel_transfer'    // Cancelar transferencia
  | 'press_digit';       // Presionar dígitos

/**
 * Estructura base de un tool en Retell AI
 */
export interface RetellTool {
  /**
   * Tipo de tool
   */
  type: RetellToolType;
  
  /**
   * Nombre único del tool
   */
  name: string;
  
  /**
   * Descripción del tool para que el LLM entienda cuándo usarlo
   */
  description: string;
  
  /**
   * Parámetros del tool (para tools de tipo 'mcp')
   */
  parameters?: RetellToolParameter[];
  
  /**
   * URL del webhook para ejecutar el tool (para tools de tipo 'mcp')
   * Compatible con webhook_url para mantener compatibilidad
   */
  webhook_url?: string;
  
  /**
   * URL del servidor MCP o webhook (requerido para tipo 'mcp')
   */
  url?: string;
  
  /**
   * Variables para tools tipo MCP (formato: { "variable_name": "description" })
   */
  variables?: Record<string, string>;
  
  /**
   * Configuración adicional específica del tipo de tool
   */
  config?: Record<string, any>;
}

/**
 * Parámetro de un tool
 */
export interface RetellToolParameter {
  /**
   * Nombre del parámetro
   */
  name: string;
  
  /**
   * Tipo del parámetro (string, number, boolean, object, array)
   */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  
  /**
   * Descripción del parámetro
   */
  description: string;
  
  /**
   * Si el parámetro es requerido
   */
  required?: boolean;
  
  /**
   * Valores permitidos (para enums)
   */
  enum?: (string | number)[];
  
  /**
   * Esquema del parámetro (para objetos y arrays)
   */
  schema?: Record<string, any>;
}

/**
 * Tool predefinido: End Call
 */
export interface EndCallTool extends RetellTool {
  type: 'end_call';
  name: 'end_call';
  description: string;
}

/**
 * Tool predefinido: MCP (Custom Function Tool)
 * Para custom tools con webhook, Retell usa el tipo 'mcp'
 */
export interface MCPTool extends RetellTool {
  type: 'mcp';
  name: string;
  description: string;
  /**
   * URL del servidor MCP o webhook que manejará el tool
   */
  url: string;
  /**
   * Variables/parámetros que se enviarán al webhook
   * Formato: { "variable_name": "description" }
   */
  variables?: Record<string, string>;
  /**
   * Parámetros estructurados (para documentación y validación)
   */
  parameters?: RetellToolParameter[];
}

/**
 * Tool predefinido: Transfer Call
 */
export interface TransferCallTool extends RetellTool {
  type: 'transfer_call';
  name: 'transfer_call';
  description: string;
  config?: {
    target_number?: string;
    target_agent_id?: string;
  };
}

/**
 * Respuesta de ejecución de un tool
 */
export interface ToolExecutionResult {
  /**
   * Si la ejecución fue exitosa
   */
  success: boolean;
  
  /**
   * Resultado de la ejecución
   */
  result?: any;
  
  /**
   * Mensaje de error si falló
   */
  error?: string;
  
  /**
   * Datos adicionales
   */
  metadata?: Record<string, any>;
}

/**
 * Ejemplos de tools comunes
 */
export const CommonRetellTools = {
  /**
   * Tool para terminar la llamada
   */
  endCall: (description: string = 'End the call with the user'): EndCallTool => ({
    type: 'end_call',
    name: 'end_call',
    description,
  }),

  /**
   * Tool para verificar estado de orden (usando MCP)
   */
  checkOrderStatus: (webhookUrl: string): MCPTool => ({
    type: 'mcp',
    name: 'check_order_status',
    description: 'Check the status of an order by order ID',
    url: webhookUrl,
    variables: {
      order_id: 'The order ID to check',
    },
    parameters: [
      {
        name: 'order_id',
        type: 'string',
        description: 'The order ID to check',
        required: true,
      },
    ],
  }),

  /**
   * Tool para obtener información del clima (usando MCP)
   */
  getWeather: (webhookUrl: string): MCPTool => ({
    type: 'mcp',
    name: 'get_weather',
    description: 'Get current weather information for a location',
    url: webhookUrl,
    variables: {
      location: 'The city or location name',
      units: 'Temperature units (celsius or fahrenheit)',
    },
    parameters: [
      {
        name: 'location',
        type: 'string',
        description: 'The city or location name',
        required: true,
      },
      {
        name: 'units',
        type: 'string',
        description: 'Temperature units (celsius or fahrenheit)',
        required: false,
        enum: ['celsius', 'fahrenheit'],
      },
    ],
  }),

  /**
   * Tool para agendar cita (usando MCP)
   */
  scheduleAppointment: (webhookUrl: string): MCPTool => ({
    type: 'mcp',
    name: 'schedule_appointment',
    description: 'Schedule an appointment for a specific date and time',
    url: webhookUrl,
    variables: {
      date: 'Date of the appointment (YYYY-MM-DD)',
      time: 'Time of the appointment (HH:MM)',
      service: 'Type of service requested',
      customer_name: 'Name of the customer',
    },
    parameters: [
      {
        name: 'date',
        type: 'string',
        description: 'Date of the appointment (YYYY-MM-DD)',
        required: true,
      },
      {
        name: 'time',
        type: 'string',
        description: 'Time of the appointment (HH:MM)',
        required: true,
      },
      {
        name: 'service',
        type: 'string',
        description: 'Type of service requested',
        required: true,
      },
      {
        name: 'customer_name',
        type: 'string',
        description: 'Name of the customer',
        required: false,
      },
    ],
  }),

  /**
   * Tool para transferir llamada
   */
  transferCall: (description: string = 'Transfer the call to another agent or department'): TransferCallTool => ({
    type: 'transfer_call',
    name: 'transfer_call',
    description,
    config: {},
  }),
};


