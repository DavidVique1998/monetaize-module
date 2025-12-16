/**
 * Tipos para Tools/Functions en Retell AI
 * Basado en la documentación de Retell AI
 */

/**
 * Tipos de tools disponibles en Retell AI
 * Según la API de Retell, los tipos válidos son:
 * - end_call: Terminar la llamada
 * - function: Custom function tool (para llamadas HTTP con métodos GET, POST, etc.)
 * - mcp: Model Context Protocol (para custom tools con webhook)
 * - transfer_call: Transferir llamada
 * - bridge_transfer: Transferir llamada (bridge)
 * - cancel_transfer: Cancelar transferencia
 * - press_digit: Presionar dígitos
 * - book_appointment_cal: Agendar cita con Cal.com
 */
export type RetellToolType = 
  | 'end_call'              // Terminar la llamada
  | 'custom'                // Custom function tool (HTTP calls) - Option 6
  | 'function'              // Custom function tool (HTTP calls) - alias para custom
  | 'mcp'                   // Model Context Protocol (para custom tools con webhook)
  | 'transfer_call'         // Transferir llamada
  | 'bridge_transfer'       // Transferir llamada (bridge)
  | 'cancel_transfer'       // Cancelar transferencia
  | 'press_digit'           // Presionar dígitos
  | 'book_appointment_cal'  // Agendar cita con Cal.com
  | 'check_availability_cal'; // Revisar disponibilidad en Cal.com

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
   * Parámetros del tool (para tools de tipo 'function' y 'mcp')
   */
  parameters?: RetellToolParameter[];
  
  /**
   * URL del webhook para ejecutar el tool (para tools de tipo 'mcp')
   * Compatible con webhook_url para mantener compatibilidad
   */
  webhook_url?: string;
  
  /**
   * URL del servidor MCP, webhook o endpoint HTTP (requerido para tipo 'mcp' y 'function')
   */
  url?: string;
  
  /**
   * Método HTTP para tools tipo 'custom'/'function' (GET, POST, PUT, DELETE, PATCH)
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /**
   * Headers HTTP para tools tipo 'custom'/'function'
   */
  headers?: Record<string, string>;
  
  /**
   * Query parameters para tools tipo 'custom'/'function'
   */
  query_params?: Record<string, string>;
  
  /**
   * Speak after execution para tools tipo 'custom'/'function'
   */
  speak_after_execution?: boolean;
  
  /**
   * Speak during execution para tools tipo 'custom'/'function'
   */
  speak_during_execution?: boolean;
  
  /**
   * Execution message description para tools tipo 'custom'/'function'
   */
  execution_message_description?: string;
  
  /**
   * Timeout en milisegundos para tools tipo 'custom'/'function'
   */
  timeout_ms?: number;
  
  /**
   * Response variables para tools tipo 'custom'/'function'
   * Mapeo de nombres de variables a JSON paths en la respuesta
   */
  response_variables?: Record<string, string>;
  
  /**
   * Variables para tools tipo MCP (formato: { "variable_name": "description" })
   */
  variables?: Record<string, string>;
  
  /**
   * Configuración adicional específica del tipo de tool
   */
  config?: Record<string, any>;
  
  // Campos específicos para transfer_call
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
  
  // Campos específicos para book_appointment_cal
  cal_api_key?: string;
  event_type_id?: number;
  timezone?: string;
  
  // Campos específicos para press_digit
  sms_content?: string;
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
 * Tool predefinido: Custom (Custom Function Tool con HTTP) - Option 6
 * Para custom tools que hacen llamadas HTTP directas según documentación Retell AI
 */
export interface CustomTool extends RetellTool {
  type: 'custom';
  name: string;
  description: string;
  /**
   * URL del endpoint HTTP (requerido)
   */
  url: string;
  /**
   * Método HTTP (GET, POST, PUT, DELETE, PATCH), default POST
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /**
   * Headers HTTP opcionales
   */
  headers?: Record<string, string>;
  /**
   * Query parameters opcionales
   */
  query_params?: Record<string, string>;
  /**
   * Parámetros estructurados (JSON Schema)
   */
  parameters?: any; // JSON Schema object
  /**
   * Speak after execution (requerido)
   */
  speak_after_execution: boolean;
  /**
   * Speak during execution (opcional)
   */
  speak_during_execution?: boolean;
  /**
   * Execution message description (opcional)
   */
  execution_message_description?: string;
  /**
   * Timeout en milisegundos (1000-600000, default 120000)
   */
  timeout_ms?: number;
  /**
   * Response variables - mapeo de nombres a JSON paths
   */
  response_variables?: Record<string, string>;
}

/**
 * Tool predefinido: Function (alias para Custom)
 * Para compatibilidad, se convierte a 'custom' al guardar
 */
export interface FunctionTool extends Omit<CustomTool, 'type'> {
  type: 'function'; // Se convierte a 'custom' al guardar
}

/**
 * Tool predefinido: MCP (Model Context Protocol)
 * Para custom tools con webhook usando MCP
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
  name: string;
  description: string;
  transfer_destination: {
    type: 'predefined' | 'agent';
    number?: string;
    agent_id?: string;
    ignore_e164_validation?: boolean;
  };
  transfer_option?: {
    type: 'cold_transfer' | 'warm_transfer';
    show_transferee_as_caller?: boolean;
  };
}

/**
 * Tool predefinido: Book Appointment Cal
 */
export interface BookAppointmentCalTool extends RetellTool {
  type: 'book_appointment_cal';
  name: string;
  description: string;
  cal_api_key: string;
  event_type_id: number;
  timezone: string;
}

/**
 * Tool predefinido: Check Availability Cal
 */
export interface CheckAvailabilityCalTool extends RetellTool {
  type: 'check_availability_cal';
  name: string;
  description: string;
  cal_api_key: string;
  event_type_id: number;
  /**
   * Opcional, si no se envía Retell usará la timezone del usuario o del servidor
   */
  timezone?: string;
}

/**
 * Tool predefinido: Press Digit
 */
export interface PressDigitTool extends RetellTool {
  type: 'press_digit';
  name: string;
  description: string;
  sms_content?: string;
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
   * Tool para custom function con HTTP
   */
  customFunction: (config: {
    name: string;
    description: string;
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    parameters?: RetellToolParameter[];
    speak_after_execution?: boolean;
  }): FunctionTool => ({
    type: 'function',
    name: config.name,
    description: config.description,
    url: config.url,
    method: config.method || 'POST',
    headers: config.headers,
    speak_after_execution: config.speak_after_execution ?? true,
    parameters: config.parameters,
  }),

  /**
   * Tool para transferir llamada
   */
  transferCall: (config: {
    name: string;
    description: string;
    destination: {
      type: 'predefined' | 'agent';
      number?: string;
      agent_id?: string;
      ignore_e164_validation?: boolean;
    };
    transfer_option?: {
      type: 'cold_transfer' | 'warm_transfer';
      show_transferee_as_caller?: boolean;
    };
  }): TransferCallTool => ({
    type: 'transfer_call',
    name: config.name,
    description: config.description,
    transfer_destination: config.destination,
    transfer_option: config.transfer_option,
  }),

  /**
   * Tool para agendar cita con Cal.com
   */
  bookAppointmentCal: (config: {
    name: string;
    description: string;
    cal_api_key: string;
    event_type_id: number;
    timezone: string;
  }): BookAppointmentCalTool => ({
    type: 'book_appointment_cal',
    name: config.name,
    description: config.description,
    cal_api_key: config.cal_api_key,
    event_type_id: config.event_type_id,
    timezone: config.timezone,
  }),

  /**
   * Tool para consultar disponibilidad en Cal.com
   */
  checkAvailabilityCal: (config: {
    name: string;
    description: string;
    cal_api_key: string;
    event_type_id: number;
    timezone?: string;
  }): CheckAvailabilityCalTool => ({
    type: 'check_availability_cal',
    name: config.name,
    description: config.description,
    cal_api_key: config.cal_api_key,
    event_type_id: config.event_type_id,
    timezone: config.timezone,
  }),

  /**
   * Tool para presionar dígitos
   */
  pressDigit: (config: {
    name: string;
    description: string;
    sms_content?: string;
  }): PressDigitTool => ({
    type: 'press_digit',
    name: config.name,
    description: config.description,
    sms_content: config.sms_content,
  }),
};


